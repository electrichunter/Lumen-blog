'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/client';

interface FollowButtonProps {
    authorId: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ authorId, onFollowChange }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Check if user is logged in
                const token = apiClient.getToken();
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Get current user ID to prevent self-follow
                const user = await apiClient.getCurrentUser();
                setCurrentUserId(user.id);

                if (user.id === authorId) {
                    setIsLoading(false);
                    return;
                }

                const status = await apiClient.checkFollowStatus(authorId);
                setIsFollowing(status.is_following);
            } catch (error) {
                console.error("Follow check failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (authorId) {
            checkStatus();
        }
    }, [authorId]);

    const handleFollow = async () => {
        setIsLoading(true);
        try {
            if (isFollowing) {
                await apiClient.unfollowUser(authorId);
                setIsFollowing(false);
                if (onFollowChange) onFollowChange(false);
            } else {
                await apiClient.followUser(authorId);
                setIsFollowing(true);
                if (onFollowChange) onFollowChange(true);
            }
        } catch (error) {
            // Likely not logged in
            window.location.href = '/login';
        } finally {
            setIsLoading(false);
        }
    };

    if (currentUserId === authorId) return null; // Don't show follow button for self

    return (
        <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isFollowing
                    ? 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-500 dark:text-gray-300 hover:border-red-500 hover:text-red-500'
                    : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                }`}
        >
            {isLoading ? '...' : isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
        </button>
    );
}
