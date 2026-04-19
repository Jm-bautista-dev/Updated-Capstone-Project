import AnalyticsController from './AnalyticsController'
import SupplierController from './SupplierController'
import RiderController from './RiderController'
import EmployeeController from './EmployeeController'
import ReportController from './ReportController'
import DeliveryController from './DeliveryController'
const Admin = {
    AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
SupplierController: Object.assign(SupplierController, SupplierController),
RiderController: Object.assign(RiderController, RiderController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
ReportController: Object.assign(ReportController, ReportController),
DeliveryController: Object.assign(DeliveryController, DeliveryController),
}

export default Admin