import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Modal = ({
  description,
  open,
  setOpen,
  title,
  children,
  showFooter = true,
  contentClassName,
  headerClassName,
}: {
  title: string;
  description: string;
  setOpen: (open: boolean) => void;
  open: boolean;
  children: React.ReactNode;
  showFooter?: boolean;
  contentClassName?: string;
  headerClassName?: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn(contentClassName)}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {showFooter && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
