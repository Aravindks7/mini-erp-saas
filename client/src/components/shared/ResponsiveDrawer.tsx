import * as React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

const ResponsiveDrawerContext = React.createContext<{ isDesktop: boolean }>({ isDesktop: true });

export function ResponsiveDrawer({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const isDesktop = useBreakpoint('md');

  return (
    <ResponsiveDrawerContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          {children}
        </Sheet>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      )}
    </ResponsiveDrawerContext.Provider>
  );
}

export function ResponsiveDrawerContent({
  className,
  children,
  side = 'right',
}: {
  className?: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const { isDesktop } = React.useContext(ResponsiveDrawerContext);

  if (isDesktop) {
    return (
      <SheetContent className={className} side={side}>
        {children}
      </SheetContent>
    );
  }

  return <DrawerContent className={className}>{children}</DrawerContent>;
}

export function ResponsiveDrawerHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isDesktop } = React.useContext(ResponsiveDrawerContext);

  if (isDesktop) {
    return <SheetHeader className={className}>{children}</SheetHeader>;
  }

  return <DrawerHeader className={className}>{children}</DrawerHeader>;
}

export function ResponsiveDrawerTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isDesktop } = React.useContext(ResponsiveDrawerContext);

  if (isDesktop) {
    return <SheetTitle className={className}>{children}</SheetTitle>;
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

export function ResponsiveDrawerDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isDesktop } = React.useContext(ResponsiveDrawerContext);

  if (isDesktop) {
    return <SheetDescription className={className}>{children}</SheetDescription>;
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>;
}

export function ResponsiveDrawerFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isDesktop } = React.useContext(ResponsiveDrawerContext);

  if (isDesktop) {
    return <SheetFooter className={className}>{children}</SheetFooter>;
  }

  return <DrawerFooter className={className}>{children}</DrawerFooter>;
}
