/** Extended profile fields a member can fill (all optional). */
export type MemberProfileExtra = {
  whatsapp?: string;
  dateOfBirth?: string;
  nativePlace?: string;
  gnati?: string;
  maritalStatus?: string;
  occupation?: string;
  occupationDetails?: string;
  officeAddress?: string;
  father?: string;
  mother?: string;
  spouse?: string;
  children?: string;
  siblings?: string;
};

export type Member = {
  samajId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
} & MemberProfileExtra;

export type GoverningBodyPerson = {
  name: string;
  position: string;
  samajId?: string;
};

export type GoverningBodyGroup = {
  group: string;
  members: GoverningBodyPerson[];
};

export type AboutFact = {
  label: string;
  value: string;
};

export type AboutContent = {
  title: string;
  paragraphs: string[];
  facts: AboutFact[];
  contact: {
    address: string;
    phone: string;
    email: string;
  };
  facilities: string[];
  services: string[];
};

export type Facility = {
  name: string;
  description: string;
};

export type PagedMembers = {
  items: Member[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location?: string;
  eventDate?: string;
  active: boolean;
  createdAt: string;
  hasBanner: boolean;
};

export type NotificationType = 'event' | 'broadcast';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  refId?: string;
  createdAt: string;
  read: boolean;
};

export type NotificationsResponse = {
  items: AppNotification[];
  unread: number;
};

export type AuthUser = {
  samajId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
  /** Force the user through the change-password flow on next sign-in. */
  mustChangePassword?: boolean;
} & MemberProfileExtra;

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type DemoAccount = {
  name: string;
  phone: string;
};
