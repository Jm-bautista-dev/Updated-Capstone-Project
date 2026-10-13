import ChangePasswordController from './ChangePasswordController'
import LogoutController from './LogoutController'
const Auth = {
    LogoutController: Object.assign(LogoutController, LogoutController),
ChangePasswordController: Object.assign(ChangePasswordController, ChangePasswordController),
}

export default Auth