import Admin from './Admin'
import Api from './Api'
import Auth from './Auth'
import BranchController from './BranchController'
import CashierShiftController from './CashierShiftController'
import CategoriesController from './CategoriesController'
import InventoryActionController from './InventoryActionController'
import InventoryController from './InventoryController'
import NotificationController from './NotificationController'
import PosController from './PosController'
import ProductsController from './ProductsController'
import SalesController from './SalesController'
import Settings from './Settings'
import StockInController from './StockInController'
import SuperAdmin from './SuperAdmin'
import WastageController from './WastageController'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
Api: Object.assign(Api, Api),
BranchController: Object.assign(BranchController, BranchController),
Admin: Object.assign(Admin, Admin),
NotificationController: Object.assign(NotificationController, NotificationController),
StockInController: Object.assign(StockInController, StockInController),
ProductsController: Object.assign(ProductsController, ProductsController),
InventoryController: Object.assign(InventoryController, InventoryController),
PosController: Object.assign(PosController, PosController),
CashierShiftController: Object.assign(CashierShiftController, CashierShiftController),
CategoriesController: Object.assign(CategoriesController, CategoriesController),
WastageController: Object.assign(WastageController, WastageController),
SalesController: Object.assign(SalesController, SalesController),
InventoryActionController: Object.assign(InventoryActionController, InventoryActionController),
SuperAdmin: Object.assign(SuperAdmin, SuperAdmin),
Settings: Object.assign(Settings, Settings),
}

export default Controllers