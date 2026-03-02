import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import styles from './styles.module.scss';

interface ThumbnailProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ src, alt, width, height }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={styles['main-img']}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOpen();
          }
        }}
      />
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames={{
          enter: styles['modal-enter'],
          enterActive: styles['modal-enter-active'],
          exit: styles['modal-exit'],
          exitActive: styles['modal-exit-active'],
        }}
        unmountOnExit
      >
        <div className={styles['modal']} onClick={handleClose}>
          <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            <button className={styles['modal-close']} onClick={handleClose} aria-label="Close">
              ×
            </button>
            <img src={src} alt={alt} className={styles['modal-img']} />
          </div>
        </div>
      </CSSTransition>
    </>
  );
};

export default Thumbnail;
