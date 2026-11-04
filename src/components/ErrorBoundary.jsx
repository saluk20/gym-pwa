import { Component } from 'react';

/** Evita la pantalla negra: muestra el error y permite volver a Home. */
export default class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="p-6">
        <h2 className="text-[20px]">Algo ha fallado</h2>
        <p className="mt-2 break-words text-[13px] text-muted">{String(this.state.err?.message || this.state.err)}</p>
        <button className="tap mt-4 h-11 rounded-pill bg-brand px-6 text-[14px] font-semibold text-onbrand" onClick={() => { this.setState({ err: null }); this.props.onReset?.(); }}>Volver</button>
      </div>
    );
  }
}
