import DashboardController from './DashboardController'
import SystemHealthController from './SystemHealthController'
import ErrorLogController from './ErrorLogController'
import LogViewerController from './LogViewerController'
import MaintenanceController from './MaintenanceController'
import AuditLogController from './AuditLogController'
import ApiMonitorController from './ApiMonitorController'
import DatabaseHealthController from './DatabaseHealthController'
import FeatureFlagController from './FeatureFlagController'
import DeploymentController from './DeploymentController'
import SecurityController from './SecurityController'
import SettingsController from './SettingsController'
import CustomerRiskController from './CustomerRiskController'
import AccountGovernanceController from './AccountGovernanceController'
import ModerationCaseController from './ModerationCaseController'
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
CustomerRiskController: Object.assign(CustomerRiskController, CustomerRiskController),
AccountGovernanceController: Object.assign(AccountGovernanceController, AccountGovernanceController),
ModerationCaseController: Object.assign(ModerationCaseController, ModerationCaseController),
}

export default SuperAdmin