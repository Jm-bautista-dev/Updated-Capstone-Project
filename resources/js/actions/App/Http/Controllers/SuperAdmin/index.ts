import ApiMonitorController from './ApiMonitorController'
import AuditLogController from './AuditLogController'
import DashboardController from './DashboardController'
import DatabaseHealthController from './DatabaseHealthController'
import DeploymentController from './DeploymentController'
import ErrorLogController from './ErrorLogController'
import FeatureFlagController from './FeatureFlagController'
import LogViewerController from './LogViewerController'
import MaintenanceController from './MaintenanceController'
import SecurityController from './SecurityController'
import SettingsController from './SettingsController'
import SystemHealthController from './SystemHealthController'
const SuperAdmin = {
    DashboardController: Object.assign(DashboardController, DashboardController),
SystemHealthController: Object.assign(SystemHealthController, SystemHealthController),
ErrorLogController: Object.assign(ErrorLogController, ErrorLogController),
LogViewerController: Object.assign(LogViewerController, LogViewerController),
MaintenanceController: Object.assign(MaintenanceController, MaintenanceController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
ApiMonitorController: Object.assign(ApiMonitorController, ApiMonitorController),
DatabaseHealthController: Object.assign(DatabaseHealthController, DatabaseHealthController),
FeatureFlagController: Object.assign(FeatureFlagController, FeatureFlagController),
DeploymentController: Object.assign(DeploymentController, DeploymentController),
SecurityController: Object.assign(SecurityController, SecurityController),
SettingsController: Object.assign(SettingsController, SettingsController),
}

export default SuperAdmin