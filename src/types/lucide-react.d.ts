declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
  }

  export type Icon = React.FC<LucideProps>;

  export const User: Icon;
  export const Lock: Icon;
  export const ArrowLeft: Icon;
  export const ChevronRight: Icon;
  export const MoreHorizontal: Icon;
  export const Search: Icon;
  export const ChevronDownIcon: Icon;
  export const CircleIcon: Icon;
  export const CheckIcon: Icon;
  export const XIcon: Icon;
  export const PanelLeftIcon: Icon;
}
