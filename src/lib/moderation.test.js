import test from 'node:test'
import assert from 'node:assert/strict'

import { dbReducer } from './reducer.js'

test('reportes de moderación se crean en pendiente y una decisión aplica la sanción', () => {
  const initialState = {
    users: {
      admin: { id: 'admin', rol: 'superadmin', activo: true },
      juan: {
        id: 'juan',
        rol: 'usuario',
        activo: true,
        silenciadoHasta: null,
        warningCount: 0,
        moderacionHistorial: [],
      },
    },
    tareas: {},
    comentarios: {
      c1: {
        id: 'c1',
        tareaId: 't1',
        userId: 'juan',
        texto: 'mensaje ofensivo',
        fecha: Date.now(),
        reacciones: {},
        reportado: false,
        fijado: false,
      },
    },
    chat: {},
    notificaciones: {},
    reportes: {},
    misionesReclamadas: {},
  }

  const reported = dbReducer(initialState, {
    type: 'REPORT_COMMENT',
    id: 'c1',
    userId: 'ana',
    motivo: 'mensaje ofensivo',
  })

  const reportId = Object.keys(reported.reportes)[0]
  assert.ok(reportId)
  assert.equal(reported.reportes[reportId].estado, 'pendiente')
  assert.equal(reported.reportes[reportId].resuelto, false)
  assert.ok(Object.values(reported.notificaciones).some((n) => n.userId === 'admin'))

  const moderated = dbReducer(reported, {
    type: 'DECIDE_REPORT',
    id: reportId,
    adminId: 'admin',
    accion: 'mute',
    observacion: 'Se aplicó silencio temporal por lenguaje ofensivo.',
  })

  assert.equal(moderated.reportes[reportId].estado, 'resuelto')
  assert.equal(moderated.reportes[reportId].accion, 'mute')
  assert.ok(moderated.users.juan.silenciadoHasta > Date.now())
  assert.equal(moderated.users.juan.moderacionHistorial.length, 1)
})

test('un rechazo de reporte se registra como rechazado sin aplicar sanción', () => {
  const initialState = {
    users: {
      admin: { id: 'admin', rol: 'superadmin', activo: true },
      juan: {
        id: 'juan',
        rol: 'usuario',
        activo: true,
        silenciadoHasta: null,
        warningCount: 0,
        moderacionHistorial: [],
      },
    },
    tareas: {},
    comentarios: {
      c1: {
        id: 'c1',
        tareaId: 't1',
        userId: 'juan',
        texto: 'mensaje neutral',
        fecha: Date.now(),
        reacciones: {},
        reportado: false,
        fijado: false,
      },
    },
    chat: {},
    notificaciones: {},
    reportes: {
      r1: {
        id: 'r1',
        tipo: 'comentario',
        refId: 'c1',
        userId: 'ana',
        targetUserId: 'juan',
        motivo: 'falso positivo',
        fecha: Date.now(),
        estado: 'pendiente',
        accion: null,
        resuelto: false,
        resueltoPor: null,
        resueltoEn: null,
        observacion: '',
      },
    },
    misionesReclamadas: {},
  }

  const result = dbReducer(initialState, {
    type: 'DECIDE_REPORT',
    id: 'r1',
    adminId: 'admin',
    accion: 'reject',
    observacion: 'No corresponde sanción. El contenido está dentro de lo permitido.',
  })

  assert.equal(result.reportes.r1.estado, 'rechazado')
  assert.equal(result.reportes.r1.accion, 'reject')
  assert.equal(result.users.juan.warningCount, 0)
  assert.equal(result.users.juan.silenciadoHasta, null)
})
