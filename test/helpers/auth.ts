type Role = 'ATTENDEE' | 'DJ';

export function testJwt(userId: string, role: Role) {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${encode({ alg: 'none' })}.${encode({ userId, role })}.sig`;
}

export function seedAuthToken(userId: string, role: Role) {
  const token = testJwt(userId, role);
  sessionStorage.setItem(`${role.toLowerCase()}:authToken:v1`, token);
  localStorage.removeItem('authToken');
  return token;
}
