export type Member = {
  samajId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
};

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

export type AuthUser = {
  samajId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
  /** Force the user through the change-password flow on next sign-in. */
  mustChangePassword?: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type DemoAccount = {
  name: string;
  phone: string;
};
