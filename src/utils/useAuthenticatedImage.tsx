import React, { useEffect, useState } from 'react';
import { getAccessToken, baseUrl } from '@/api/client';

export function useAuthenticatedImageUrl(
  imagePath: string | null | undefined,
  cacheKey?: any
): { imageUrl: string | null; isLoading: boolean; error: Error | null } {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    // If it's already a data URI or blob URL, use directly
    if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
      setImageUrl(imagePath);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let createdBlobUrl: string | null = null;

    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fullUrl = imagePath.startsWith('http')
          ? imagePath
          : `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

        const token = getAccessToken();
        const response = await fetch(fullUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Image blob is empty');
        }

        createdBlobUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setImageUrl(createdBlobUrl);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setImageUrl(null);
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [imagePath, cacheKey]);

  return { imageUrl, isLoading, error };
}

interface AuthenticatedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: React.ReactNode;
  cacheKey?: any;
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  fallback = null,
  cacheKey,
  alt,
  className,
  ...rest
}) => {
  const { imageUrl, isLoading, error } = useAuthenticatedImageUrl(src, cacheKey);

  if (isLoading) {
    return <div className={`animate-pulse bg-gray-100 ${className || 'w-12 h-12 rounded'}`} />;
  }

  if (error || !imageUrl) {
    return <>{fallback}</>;
  }

  return <img src={imageUrl} alt={alt || 'Image'} className={className} {...rest} />;
};
