import DeliveryController from './DeliveryController'
import AnalyticsController from './AnalyticsController'
import SupplierController from './SupplierController'
import RiderController from './RiderController'
import EmployeeController from './EmployeeController'
import SalesDataManagementController from './SalesDataManagementController'
import ReportController from './ReportController'
import ReviewController from './ReviewController'
const Admin = {
    DeliveryController: Object.assign(DeliveryController, DeliveryController),
AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
SupplierController: Object.assign(SupplierController, SupplierController),
RiderController: Object.assign(RiderController, RiderController),
EmployeeController: Object.assign(EmployeeController, EmployeeController),
SalesDataManagementController: Object.assign(SalesDataManagementController, SalesDataManagementController),
ReportController: Object.assign(ReportController, ReportController),
ReviewController: Object.assign(ReviewController, ReviewController),
}

export default Admin