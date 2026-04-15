declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
  }

  export type Icon = React.FC<LucideProps>;

  export const AlertCircle: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const Camera: Icon;
  export const Check: Icon;
  export const CheckIcon: Icon;
  export const ChevronDownIcon: Icon;
  export const ChevronLeft: Icon;
  export const ChevronLeftIcon: Icon;
  export const ChevronRight: Icon;
  export const ChevronRightIcon: Icon;
  export const ChevronUpIcon: Icon;
  export const CircleIcon: Icon;
  export const Clock: Icon;
  export const Copy: Icon;
  export const Crown: Icon;
  export const Download: Icon;
  export const GripVerticalIcon: Icon;
  export const Headphones: Icon;
  export const Lock: Icon;
  export const LogOut: Icon;
  export const MinusIcon: Icon;
  export const Moon: Icon;
  export const MoreHorizontal: Icon;
  export const MoreHorizontalIcon: Icon;
  export const PanelLeftIcon: Icon;
  export const Play: Icon;
  export const Plus: Icon;
  export const QrCode: Icon;
  export const Search: Icon;
  export const SearchIcon: Icon;
  export const Settings: Icon;
  export const SkipForward: Icon;
  export const Sun: Icon;
  export const ThumbsDown: Icon;
  export const ThumbsUp: Icon;
  export const Ticket: Icon;
  export const Upload: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const UserX: Icon;
  export const X: Icon;
  export const XIcon: Icon;
  export const Zap: Icon;
}
