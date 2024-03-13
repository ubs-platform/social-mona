export type RoleAuthorizationConfigKey =
  | 'EDIT'
  | 'ADD'
  | 'REMOVE'
  | 'GETALL'
  | 'GETID'
  | 'ALL';

export type RoleAuthorizationDetailed = {
  needsAuthenticated: boolean;
  roles: string[];
};

export type RoleAuthorization =
  | null
  | undefined
  | boolean
  | RoleAuthorizationDetailed;

export interface ControllerConfiguration {
  authorization: { [key in RoleAuthorizationConfigKey]?: RoleAuthorization };
}
