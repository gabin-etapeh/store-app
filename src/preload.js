// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('db', {
	listNotes: () => ipcRenderer.invoke('db:listNotes'),
	addNote: (text) => ipcRenderer.invoke('db:addNote', text),
	deleteNote: (id) => ipcRenderer.invoke('db:deleteNote', id),
});