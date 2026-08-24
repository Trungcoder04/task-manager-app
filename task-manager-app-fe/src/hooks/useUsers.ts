import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types/user.types';
import { userService, CreateUserPayload, UpdateUserPayload } from '../services/userService';
import { useToast } from './useToast';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);
    const { showToast } = useToast();

    // Tai danh sach nguoi dung tu backend
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách người dùng';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void fetchUsers();
    }, []);

    // Reset ve Trang 1 khi thay doi Tu khoa hoac Trang thai
    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter]);

    // Loc danh sach nguoi dung theo tu khoa tim kiem va trang thai
    const filteredUsers = useMemo(() => {
        let result = users;
        if (statusFilter !== 'all') {
            result = result.filter((u) => (u.status ?? 1) === statusFilter);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(
                (u) =>
                    u.username.toLowerCase().includes(term) ||
                    u.fullName.toLowerCase().includes(term) ||
                    (u.email && u.email.toLowerCase().includes(term)),
            );
        }
        return result;
    }, [users, searchTerm, statusFilter]);

    // Phan trang danh sach nguoi dung
    const totalPages = useMemo(() => Math.ceil(filteredUsers.length / pageSize) || 1, [filteredUsers, pageSize]);
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page, pageSize]);

    // Ham tao moi nguoi dung
    const createUser = async (payload: CreateUserPayload) => {
        try {
            const newUser = await userService.createUser(payload);
            setUsers((prev) => [...prev, newUser]);
            showToast(`Đã tạo tài khoản "${newUser.username}" thành công!`, 'success');
            return newUser;
        } catch (err) {
           const msg = err instanceof Error ? err.message : 'Tạo người dùng thất bại';
           showToast(msg, 'error');
           throw err;
        }
    }

    // Ham cap nhat nguoi dung
    const updateUser = async (userId: number, payload: UpdateUserPayload) => {
        try {
        const updatedUser = await userService.updateUser(userId, payload);
        setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
        showToast('Cập nhật thông tin thành công!', 'success');
        return updatedUser;
        } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
        showToast(msg, 'error');
        throw err;
        }
    };

    // Xoa nguoi dung
    const deleteUser = async (userId: number) => {
        try {
            await userService.deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            showToast('Đã xóa tài khoản người dùng!', 'info');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Xóa người dùng thất bại';
            showToast(msg, 'error');
            throw err;
        }
    }
   return {
    users,
    filteredUsers,
    paginatedUsers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
   }
}