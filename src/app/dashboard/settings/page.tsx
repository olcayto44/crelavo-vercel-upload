import {CustomerPage} from "@/components/CustomerDashboard";
import {CustomerAccountSettings} from "@/components/CustomerAccountSettings";
export default function SettingsPage(){return <CustomerPage active="/dashboard/settings" title="Settings" description="Manage your account and Studio preferences."><CustomerAccountSettings/></CustomerPage>}
