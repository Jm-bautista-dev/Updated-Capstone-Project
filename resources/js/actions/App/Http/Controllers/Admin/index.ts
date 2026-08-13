import AnalyticsController from './AnalyticsController'
import SupplierController from './SupplierController'
import RiderController from './RiderController'
import EmployeeController from './EmployeeController'
import SalesDataManagementController from './SalesDataManagementController'
import ReportController from './ReportController'
import DeliveryController from './DeliveryController'
import ReviewController from './ReviewController'
const Admin = {
    AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
SupplierController: Object.assign(SupplierController, SupplierController),
RiderController: Object.assign(RiderController, RiderController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
SalesDataManagementController: Object.assign(SalesDataManagementController, SalesDataManagementController),
ReportController: Object.assign(ReportController, ReportController),
DeliveryController: Object.assign(DeliveryController, DeliveryController),
ReviewController: Object.assign(ReviewController, ReviewController),
}

export default Admin