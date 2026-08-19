import { User, UserUpdateRequest } from '../types/user.types';
import { INITIAL_USERS } from './mockData';

const USERS_STORAGE_KEY = 'task_manager_all_users';

class UserService {
  private getStoredUsers(): User[] {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data) as User[];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  getUsers(): Promise<User[]> {
    return Promise.resolve(this.getStoredUsers());
  }

  getUser(id: number): Promise<User> {
    const users = this.getStoredUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return Promise.reject(new Error('User not found'));
    return Promise.resolve(user);
  }

  updateUser(id: number, data: UserUpdateRequest): Promise<User> {
    const users = this.getStoredUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return Promise.reject(new Error('User not found'));

    const updatedUser: User = {
      ...users[index],
      fullName: data.fullName ?? users[index].fullName,
      email: data.email ?? users[index].email,
    };

    users[index] = updatedUser;
    this.saveUsers(users);

    // Also update current active user session if matched
    const currentUser = localStorage.getItem('task_manager_user');
    if (currentUser) {
      const parsed = JSON.parse(currentUser) as User;
      if (parsed.id === id) {
        localStorage.setItem('task_manager_user', JSON.stringify(updatedUser));
      }
    }

    return Promise.resolve(updatedUser);
  }
}

export const userService = new UserService();
