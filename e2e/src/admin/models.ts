import {AdminsPage} from './models/adminsPage';
import {Header} from './models/header';
import {LoginPage} from './models/loginPage';

/** Модели админки: из этой карты строятся фикстуры `testAdmin`. */
export const adminModels = {
  header: Header,
  loginPage: LoginPage,
  adminsPage: AdminsPage,
};
