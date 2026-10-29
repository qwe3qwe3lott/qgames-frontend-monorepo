import {
  AVATAR_LABELS,
  PLAYER_AVATARS,
  PlayerAvatar,
  type PlayerAvatarKind,
} from '@qgames/game-ui/components/PlayerAvatar';
import {Label} from '@qgames/ui/components/Label';
import {RadioGroup, RadioGroupItem} from '@qgames/ui/components/RadioGroup';

export interface AvatarPickerProps {
  /** Префикс id полей, чтобы на странице могло быть несколько выборов. */
  idPrefix: string;
  value: PlayerAvatarKind;
  onChange: (avatar: PlayerAvatarKind) => void;
}

function isAvatar(value: string): value is PlayerAvatarKind {
  return (PLAYER_AVATARS as readonly string[]).includes(value);
}

/** Выбор аватара из набора, определённого на фронте. */
export function AvatarPicker({idPrefix, value, onChange}: AvatarPickerProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={next => {
        if (isAvatar(next)) {
          onChange(next);
        }
      }}
      className="flex gap-4"
    >
      {PLAYER_AVATARS.map(avatar => (
        <Label
          key={avatar}
          htmlFor={`${idPrefix}-${avatar}`}
          className="flex items-center gap-2"
        >
          <RadioGroupItem id={`${idPrefix}-${avatar}`} value={avatar} />
          <PlayerAvatar avatar={avatar} />
          {AVATAR_LABELS[avatar]}
        </Label>
      ))}
    </RadioGroup>
  );
}
