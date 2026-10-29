import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Toaster as Sonner, type ToasterProps} from 'sonner';

function sonnerTheme(
  theme: string | undefined,
): NonNullable<ToasterProps['theme']> {
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}

function Toaster({...props}: ToasterProps) {
  const {theme} = useTheme();

  return (
    <Sonner
      theme={sonnerTheme(theme)}
      position="bottom-left"
      // Свои переменные Sonner задаёт селектором с двумя атрибутами, поэтому тема перекрывает их с `!`.
      className="toaster group [--border-radius:var(--radius)]! [--normal-bg:var(--popover)]! [--normal-border:var(--border)]! [--normal-text:var(--popover-foreground)]!"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  );
}

export {Toaster};
export {toast} from 'sonner';
