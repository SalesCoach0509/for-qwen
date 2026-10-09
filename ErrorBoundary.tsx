import { Component, ReactNode } from 'react';
export default class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="max-w-xl mx-auto p-8"><h1 className="text-2xl font-bold">This screen could not be opened</h1><p className="my-4">Your saved work is retained. Return home to recover.</p><button className="bg-blue-600 text-white rounded-lg px-5 py-3" onClick={()=>window.location.reload()}>Return home</button></main>:this.props.children;}
}
