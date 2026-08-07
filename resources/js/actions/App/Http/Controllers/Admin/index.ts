import AnalyticsController from './AnalyticsController'
import DeliveryController from './DeliveryController'
import EmployeeController from './EmployeeController'
import ReportController from './ReportController'
import RiderController from './RiderController'
import SalesDataManagementController from './SalesDataManagementController'
import SupplierController from './SupplierController'
const Admin = {
    AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
SupplierController: Object.assign(SupplierController, SupplierController),
RiderController: Object.assign(RiderController, RiderController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
SalesDataManagementController: Object.assign(SalesDataManagementController, SalesDataManagementController),
ReportController: Object.assign(ReportController, ReportController),
DeliveryController: Object.assign(DeliveryController, DeliveryController),
}

export default Admin