import {AuthDialog} from './models/authDialog';
import {CheckersBoard} from './models/checkersBoard';
import {GameRoomsPage} from './models/gameRoomsPage';
import {GamesPage} from './models/gamesPage';
import {Header} from './models/header';
import {HomePage} from './models/homePage';
import {NothingBoard} from './models/nothingBoard';
import {RoomPage} from './models/roomPage';
import {RoomPanel} from './models/roomPanel';
import {RoomSettingsDialog} from './models/roomSettingsDialog';
import {SessionActions} from './models/sessionActions';

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
  roomSettingsDialog: RoomSettingsDialog,
  sessionActions: SessionActions,
  checkersBoard: CheckersBoard,
  nothingBoard: NothingBoard,
};
