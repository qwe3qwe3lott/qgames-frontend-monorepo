import {Component, type ReactNode} from 'react';

/** Ошибка загрузки чанка игры не должна ронять страницу комнаты. */
export class ChunkErrorBoundary extends Component<
  {children: ReactNode; fallback: ReactNode},
  {failed: boolean}
> {
  override state = {failed: false};

  static getDerivedStateFromError(): {failed: boolean} {
    return {failed: true};
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
