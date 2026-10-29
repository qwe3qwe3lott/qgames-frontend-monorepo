import {readFile, writeFile} from 'node:fs/promises';

import {expect, test} from '@playwright/test';

import {readFrames, type RecordedFrame} from '../core/sseRecorder';
import {expected} from '../core/testBasic';
import type {Actor, Actors} from '../portal/testPortal';
import {drivers} from './drivers';
import {frameSeq, normalizeFrame} from './normalize';
import {
  scenarioSchema,
  type ExpectedFrames,
  type Frame,
  type Scenario,
} from './schema';

/** Режим записи: ОР не проверяются, а пишутся в файл сценария. */
const RECORDING = process.env['E2E_UPDATE_SCENARIOS'] === '1';

/** Тишина в потоках, после которой запись считает ход доставленным. */
const QUIET_MS = 700;

/** Сколько запись ждёт кадров после хода, прежде чем упасть. */
const RECORD_TIMEOUT_MS = 30_000;

const SESSION_STREAM = /\/sessions\/([^/]+)\/events/;

interface Participant {
  name: string;
  role: 'PLAYER' | 'SPECTATOR';
  actor: Actor;
  /** Сколько кадров партии уже разобрано. */
  seen: number;
}

/** Кадры потока партии, полученные актором. */
async function sessionFrames(actor: Actor): Promise<RecordedFrame[]> {
  return (await readFrames(actor.page)).filter(frame =>
    SESSION_STREAM.test(frame.url),
  );
}

function seqLabel(frames: readonly Frame[]): string {
  const seqs = frames.map(frameSeq).filter(seq => seq !== null);
  if (seqs.length === 0) {
    return 'нет кадров';
  }
  const first = Math.min(...seqs);
  const last = Math.max(...seqs);
  return first === last
    ? `seq ${String(first)}`
    : `seq ${String(first)}–${String(last)}`;
}

class ScenarioRun {
  private readonly ids = new Map<string, string>();
  private readonly scenario: Scenario;
  private readonly participants: readonly Participant[];

  constructor(scenario: Scenario, participants: readonly Participant[]) {
    this.scenario = scenario;
    this.participants = participants;
    for (const participant of participants) {
      this.ids.set(participant.actor.id, `{{${participant.name}.id}}`);
    }
  }

  addId(id: string, placeholder: string): void {
    this.ids.set(id, placeholder);
  }

  /**
   * Новые кадры партии каждого актора: проверка с [expectedFrames] или, в
   * режиме записи, сами кадры после затишья во всех потоках.
   */
  async collect(
    expectedFrames: ExpectedFrames | undefined,
  ): Promise<ExpectedFrames> {
    if (RECORDING) {
      return this.record();
    }
    if (expectedFrames === undefined) {
      throw new Error(
        'В файле нет ожидаемых кадров: запишите их (E2E_UPDATE_SCENARIOS=1)',
      );
    }
    for (const participant of this.participants) {
      const frames = expectedFrames[participant.name] ?? [];
      await expected(
        `${participant.name} получил кадры партии: ${seqLabel(frames)}`,
        async () => {
          const target = participant.seen + frames.length;
          await expect
            .poll(async () => (await sessionFrames(participant.actor)).length)
            .toBeGreaterThanOrEqual(target);
          const received = (await sessionFrames(participant.actor))
            .slice(participant.seen, target)
            .map(frame => normalizeFrame(frame, this.ids));
          expect(received).toEqual(frames);
          participant.seen = target;
        },
      );
    }
    return expectedFrames;
  }

  /** После хода: лишних кадров нет ни у кого. */
  async expectNoMoreFrames(): Promise<void> {
    await expected('Лишних кадров партии нет', async () => {
      await this.actorsPage().waitForTimeout(QUIET_MS);
      for (const participant of this.participants) {
        const frames = await sessionFrames(participant.actor);
        expect(
          frames.slice(participant.seen).map(f => normalizeFrame(f, this.ids)),
          participant.name,
        ).toEqual([]);
      }
    });
  }

  private actorsPage() {
    const first = this.participants[0];
    if (first === undefined) {
      throw new Error('В сценарии нет участников');
    }
    return first.actor.page;
  }

  /** Ждёт затишья во всех потоках и забирает новые кадры. */
  private async record(): Promise<ExpectedFrames> {
    const counts = async () =>
      Promise.all(
        this.participants.map(async p => (await sessionFrames(p.actor)).length),
      );
    let previous = await counts();
    const deadline = Date.now() + RECORD_TIMEOUT_MS;
    for (;;) {
      if (Date.now() > deadline) {
        throw new Error(
          `За ${String(RECORD_TIMEOUT_MS / 1000)} с не все участники получили новые кадры партии`,
        );
      }
      await this.actorsPage().waitForTimeout(QUIET_MS);
      const current = await counts();
      const fresh = current.every(
        (count, i) => count > (this.participants[i]?.seen ?? 0),
      );
      const quiet = current.every((count, i) => count === previous[i]);
      if (fresh && quiet) {
        break;
      }
      previous = current;
    }
    const result: ExpectedFrames = {};
    for (const participant of this.participants) {
      const frames = await sessionFrames(participant.actor);
      this.registerSession(frames);
      result[participant.name] = frames
        .slice(participant.seen)
        .map(frame => normalizeFrame(frame, this.ids));
      participant.seen = frames.length;
    }
    return result;
  }

  /** id партии из адреса потока — подстановка `{{sessionId}}`. */
  registerSession(frames: readonly RecordedFrame[]): void {
    const sessionId = frames
      .map(frame => SESSION_STREAM.exec(frame.url)?.[1])
      .find(id => id !== undefined);
    if (sessionId !== undefined) {
      this.addId(sessionId, '{{sessionId}}');
    }
  }

  async moveBy(name: string, move: unknown): Promise<void> {
    const participant = this.participants.find(p => p.name === name);
    if (participant === undefined) {
      throw new Error(`В сценарии нет актора ${name}`);
    }
    const driver = drivers[this.scenario.game];
    if (driver === undefined) {
      throw new Error(`Нет драйвера игры ${this.scenario.game}`);
    }
    await driver.move(participant.actor, move);
  }
}

/** Участник [participant] входит в комнату с ролью из сценария. */
async function enterRoom(
  host: Actor,
  participant: Participant,
  gameCode: string,
  roomId: string,
): Promise<void> {
  const {actor, role} = participant;
  if (actor !== host) {
    await actor.roomPage.open(gameCode, roomId);
  }
  const asPlayer = host.roomPanel.player(actor.id);
  const asSpectator = host.roomPanel.spectator(actor.id);
  await expect(asPlayer.or(asSpectator)).toBeVisible();
  const wanted = role === 'PLAYER' ? asPlayer : asSpectator;
  if (!(await wanted.isVisible())) {
    await actor.roomPanel.changeRoleButton(role).click();
  }
  await expect(wanted).toBeVisible();
}

/**
 * Прогоняет сценарий партии: участники входят в комнату, хост начинает партию
 * с seed из файла, затем каждый ход делается кликами по доске, а кадры потока
 * партии каждого участника сравниваются с ОР из файла. С
 * `E2E_UPDATE_SCENARIOS=1` кадры не проверяются, а записываются в файл.
 */
export async function runScenario(file: string, actors: Actors): Promise<void> {
  const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
  const scenario = scenarioSchema.parse(raw);
  const participants: Participant[] = [];
  for (const [index, {name, role}] of scenario.actors.entries()) {
    const actor = index === 0 ? actors.main() : await actors.player();
    participants.push({name, role, actor, seen: 0});
  }
  const [host] = participants;
  if (host === undefined) {
    throw new Error('В сценарии нет участников');
  }
  const run = new ScenarioRun(scenario, participants);

  await test.step('Предусловие: настройки выставлены, участники в комнате, партия начата', async () => {
    await host.actor.gameRoomsPage.open(scenario.game);
    await host.actor.gameRoomsPage.createRoomButton.click();
    const roomId = await host.actor.roomPage.roomId();
    run.addId(roomId, '{{roomId}}');
    // Настройки — до входа остальных: владелец меняет их, пока в комнате один.
    if (scenario.settings !== undefined) {
      await host.actor.roomSettingsDialog.apply(scenario.settings);
    }
    for (const participant of participants) {
      await enterRoom(host.actor, participant, scenario.game, roomId);
    }
    // Seed — только в запросе старта этого сценария.
    await host.actor.page.route(
      '**/api/rooms/*/session',
      async route => {
        const request = route.request();
        if (request.method() !== 'POST') {
          await route.fallback();
          return;
        }
        await route.continue({
          headers: {
            ...request.headers(),
            'x-qgames-seed': String(scenario.seed),
          },
        });
      },
      {times: 1},
    );
    await host.actor.sessionActions.startButton.click();
    await expect
      .poll(async () => (await sessionFrames(host.actor)).length)
      .toBeGreaterThan(0);
    run.registerSession(await sessionFrames(host.actor));
    const start = await run.collect(scenario.start?.expected);
    scenario.start = {expected: start};
  });

  for (const [index, step] of scenario.steps.entries()) {
    await test.step(`Шаг ${String(index + 1)}: ${step.actor} — ${step.title}`, async () => {
      await run.moveBy(step.actor, step.move);
      step.expected = await run.collect(step.expected);
    });
  }

  if (RECORDING) {
    await writeFile(file, `${JSON.stringify(scenario, null, 2)}\n`);
    return;
  }
  await test.step(`Шаг ${String(scenario.steps.length + 1)}: Подождать после последнего хода`, async () => {
    await run.expectNoMoreFrames();
  });
}
