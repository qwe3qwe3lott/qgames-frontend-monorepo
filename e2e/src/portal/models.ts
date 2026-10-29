import {AuthDialog} from './models/auth-dialog';
import {CheckersBoard} from './models/checkers-board';
import {GameRoomsPage} from './models/game-rooms-page';
import {GamesPage} from './models/games-page';
import {Header} from './models/header';
import {HomePage} from './models/home-page';
import {NothingBoard} from './models/nothing-board';
import {RoomPage} from './models/room-page';
import {RoomPanel} from './models/room-panel';
import {SessionActions} from './models/session-actions';

/**
 * Модели портала: из этой карты строятся фикстуры `testPortal`
 * (`({homePage}) => …`) и модели акторов (`host.homePage`).
 */
export const portalModels = {
  header: Header,
  authDialog: AuthDialog,
  homePage: HomePage,
  gamesPage: GamesPage,
  gameRoomsPage: GameRoomsPage,
  roomPage: RoomPage,
  roomPanel: RoomPanel,
  sessionActions: SessionActions,
  checkersBoard: CheckersBoard,
  nothingBoard: NothingBoard,
};
