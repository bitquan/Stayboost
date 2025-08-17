import { Icon } from '@shopify/polaris';
import { StarFilledIcon, StarIcon } from '@shopify/polaris-icons';
import { useState } from 'react';

export function TemplateFavoriteButton({ 
  templateId, 
  isFavorited = false, 
  onFavoriteToggle,
  size = 'small',
  disabled = false 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      const method = favorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/template-favorites?templateId=${templateId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        const newFavoritedState = !favorited;
        setFavorited(newFavoritedState);
        
        // Call parent callback if provided
        if (onFavoriteToggle) {
          onFavoriteToggle(templateId, newFavoritedState);
        }
      } else {
        console.error('Failed to toggle favorite:', result.error);
        // Show error toast or notification here if needed
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Show error toast or notification here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'var(--p-color-bg-surface-hover)'
    }
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleToggleFavorite}
      disabled={disabled || isLoading}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Icon
        source={favorited ? StarFilledIcon : StarIcon}
        tone={favorited ? 'warning' : 'subdued'}
      />
      {isLoading && (
        <span style={{ 
          marginLeft: '4px', 
          fontSize: '12px', 
          color: '#6B7280' 
        }}>
          ...
        </span>
      )}
    </button>
  );
}
