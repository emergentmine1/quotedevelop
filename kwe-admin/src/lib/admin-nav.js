import { DollarSign, Users, FileText } from 'lucide-react';

export const ROLE_LABELS = { READ_ONLY: 'Read-Only', READ_WRITE: 'Read + Write' };
export const ANY_ROLE = ['READ_ONLY', 'READ_WRITE'];
export const WRITE_ROLE = ['READ_WRITE'];

export const ADMIN_NAV = [
  { to: '/admin/pricing', label: 'Pricing Matrix', short: 'Pricing', icon: DollarSign, roles: WRITE_ROLE },
  { to: '/admin/leads', label: 'Customer Leads', short: 'Leads', icon: Users, roles: ANY_ROLE },
  { to: '/admin/quotes', label: 'Quotes', short: 'Quotes', icon: FileText, roles: ANY_ROLE },
];

export const navFor = (role) => ADMIN_NAV.filter((n) => n.roles.includes(role));
export const homeFor = (role) => navFor(role)[0]?.to || '/login';
/** Post-login target: the page the user asked for if their role allows it, otherwise their home. */
export const landingFor = (role, from) =>
  from && navFor(role).some((n) => from.startsWith(n.to)) ? from : homeFor(role);
