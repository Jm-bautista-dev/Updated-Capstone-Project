import LogoutController from './LogoutController'
import ChangePasswordController from './ChangePasswordController'
const Auth = {
    LogoutController: Object.assign(LogoutController, LogoutController),
ChangePasswordController: Object.assign(ChangePasswordController, ChangePasswordController),
}

export default Auth