import {AdminsPage} from './models/admins-page';
import {Header} from './models/header';
import {LoginPage} from './models/login-page';

/** Модели админки: из этой карты строятся фикстуры `testAdmin`. */
export const adminModels = {
  header: Header,
  loginPage: LoginPage,
  adminsPage: AdminsPage,
};
