/**
 * Design system-ul Corbul.md — SPEC §5.
 * Import comod: `import { Card, SectionHead, Button } from "@/components/ui";`
 * (importul direct pe fișier funcționează la fel de bine).
 */

export { cn } from "./cn";
export type { ClassValue } from "./cn";

export { microcopy } from "./microcopy";
export type { Microcopy } from "./microcopy";

export { Avatar } from "./Avatar";
export type { AvatarProps, AvatarSize } from "./Avatar";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeSize, BadgeTone } from "./Badge";

export { Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";

export { Card } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { Container } from "./Container";
export type { ContainerProps, ContainerSize, ContainerTag } from "./Container";

export { Cover } from "./Cover";
export type { CoverProps } from "./Cover";

export { Divider } from "./Divider";
export type { DividerProps, DividerVariant } from "./Divider";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { Field } from "./Field";
export type {
  FieldChangeEvent,
  FieldControl,
  FieldOption,
  FieldProps,
} from "./Field";

export { ConfirmModal, Modal } from "./Modal";
export type { ConfirmModalProps, ModalProps, ModalSize } from "./Modal";

export { useFocusTrap, FOCUSABLE_SELECTOR } from "./useFocusTrap";
export type { FocusTrapOptions } from "./useFocusTrap";

export { Pagination } from "./Pagination";
export type { PaginationProps } from "./Pagination";

export { Prose } from "./Prose";
export type { ProseProps } from "./Prose";

export { RavenMark } from "./RavenMark";
export type { RavenMarkProps } from "./RavenMark";

export { SectionHead } from "./SectionHead";
export type { SectionHeadProps } from "./SectionHead";

export { ShareRow } from "./ShareRow";
export type { ShareRowProps } from "./ShareRow";

export { Skeleton, SkeletonCard, SkeletonText } from "./Skeleton";
export type {
  SkeletonCardProps,
  SkeletonProps,
  SkeletonTextProps,
} from "./Skeleton";

export { ToastProvider, useToast } from "./Toast";
export type {
  ToastApi,
  ToastItem,
  ToastOptions,
  ToastProviderProps,
  ToastTone,
} from "./Toast";

export { ThemeScript, THEME_STORAGE_KEY } from "./ThemeScript";
export { ThemeToggle } from "./ThemeToggle";
export type { Theme, ThemeToggleProps } from "./ThemeToggle";
