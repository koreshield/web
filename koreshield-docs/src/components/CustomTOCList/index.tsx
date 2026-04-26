import React from 'react';
import styles from './styles.module.scss';

interface CustomTOCListProps {
  children: React.ReactNode;
}

interface CustomTOCListSectionProps {
  children: React.ReactNode;
}

interface CustomTOCListHeadProps {
  children: React.ReactNode;
}

interface CustomTOCListContentProps {
  children: React.ReactNode;
}

export const CustomTOCList: React.FC<CustomTOCListProps> = ({ children }) => (
  <div className={styles['toc-list']}>
    {children}
  </div>
);

export const CustomTOCListSection: React.FC<CustomTOCListSectionProps> = ({ children }) => (
  <div className={styles['toc-list-section']}>
    {children}
  </div>
);

export const CustomTOCListHead: React.FC<CustomTOCListHeadProps> = ({ children }) => (
  <div className={styles['toc-list-head']}>
    {children}
  </div>
);

export const CustomTOCListContent: React.FC<CustomTOCListContentProps> = ({ children }) => {
  const childrenArray = React.Children.toArray(children);
  return (
    <ul className={styles['toc-list-content']}>
      {childrenArray.map((child, index) => (
        <li key={`toc-lc-${index}`}>{child}</li>
      ))}
    </ul>
  );
};
