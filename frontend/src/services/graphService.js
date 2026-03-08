import api from './api'

export const graphService = {
    getGraphData: () => api.get('/graph'),
}
