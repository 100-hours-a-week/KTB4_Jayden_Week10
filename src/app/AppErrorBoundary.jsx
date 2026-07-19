import { Component } from 'react';

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="placeholder-page" role="alert">
          <h1>화면을 표시하지 못했습니다</h1>
          <p>페이지를 새로고침한 뒤 다시 시도해주세요.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
