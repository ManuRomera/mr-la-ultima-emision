<div align="center">

<img src="assets/cover.svg" alt="MR-La Última Emisión" width="100%">

# MR-La Última Emisión

**Una emisora de radio interactiva y agnóstica de sistema para Foundry VTT.**

  <a href="https://github.com/ManuRomera/mr-la-ultima-emision/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/ManuRomera/mr-la-ultima-emision?include_prereleases&style=for-the-badge&color=b8860b&label=release"></a>
  <a href="https://foundryvtt.com"><img alt="Foundry VTT V13 – V14" src="https://img.shields.io/badge/Foundry%20VTT-V13%20%E2%80%93%20V14-57d8c8?style=for-the-badge"></a>
  <a href="https://github.com/ManuRomera/mr-la-ultima-emision/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/ManuRomera/mr-la-ultima-emision/total?style=for-the-badge&color=ff7a1f"></a>
  <img alt="System" src="https://img.shields.io/badge/system-agnostic-2b3245?style=for-the-badge">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-2b3245?style=for-the-badge"></a>

**Idea y obra original:** **MIDRA · Midespinas & Amdra**  
**Implementación del módulo para Foundry VTT:** **Manu Romera**

[Ver página del proyecto](https://manuromera.github.io/mr-la-ultima-emision/) · [Descargar última versión](https://github.com/ManuRomera/mr-la-ultima-emision/releases/latest) · [Derechos y créditos](RIGHTS.md)

</div>

---

## Una radio dentro de cualquier sistema

**MR-La Última Emisión** convierte cualquier mundo de Foundry VTT en una emisora de radio jugable sin sustituir el sistema que ya estés usando. No registra tipos de Actor ni Item, no modifica las reglas del juego activo y no exige una ficha concreta: la radio funciona como una capa independiente sobre el mundo.

El GM adopta el papel de **Locutor** y dispone de una mesa de emisión completa. Los jugadores pueden participar como **Oyentes**, solicitar entrar en antena, recibir información y seguir el estado de la transmisión mientras la escena muestra un panel público sincronizado.

> **La idea original, el concepto creativo y la obra de La Última Llamada pertenecen a MIDRA · Midespinas & Amdra.** Manu Romera es el creador de esta implementación modular para Foundry VTT, no del concepto original.

## Así se ve

<p align="center">
  <img src="docs/img/consola.png" alt="Consola del Locutor: emisión, llamadas, interferencias y herramientas" width="68%">
  <img src="docs/img/panel-publico.png" alt="Panel público en directo sobre la escena con la señal 5/6" width="30%">
</p>

## Funciones

| Emisión | Oyentes | Mesa del Locutor | Calidad de vida |
|---|---|---|---|
| Panel público sobre la escena | Alias y frecuencia personal | Titular y mensaje público | Memoria de posición y tamaño |
| Estado y señal segmentada | Solicitudes privadas de llamada | Llamada en antena y cola | Recuperación de ventanas fuera de pantalla |
| Interferencias y avisos | Solicitudes concurrentes | Historial de llamadas | Memoria de pestañas |
| Mensajes de emisión al chat | Panel independiente del sistema | Notas privadas | `safeRender` mientras se escribe |
| Overlay movible y bloqueable | Sin tocar la ficha del PJ | Macros de control | Alto contraste, texto grande y movimiento reducido |

Además incluye i18n **español/inglés**, ayuda contextual mediante hover/clic derecho, navegación por teclado, API pública, diagnóstico, macros idempotentes y compatibilidad con Foundry VTT 13 y 14.

## Instalación

En Foundry VTT abre **Add-on Modules → Install Module** y usa este manifest:

```text
https://github.com/ManuRomera/mr-la-ultima-emision/releases/latest/download/module.json
```

También puedes descargar el ZIP desde la [última release](https://github.com/ManuRomera/mr-la-ultima-emision/releases/latest).

## Uso rápido

1. Activa **MR-La Última Emisión** en el mundo que quieras, independientemente del sistema de juego.
2. El GM abre la **Consola del Locutor** desde los controles del módulo o mediante las macros generadas.
3. Cada jugador abre su **Panel de Oyente**.
4. El Locutor decide qué sale al aire; las solicitudes privadas permanecen privadas hasta que se ponen en antena.
5. Activa el **panel público** para proyectar la emisión sobre la escena.

## Compatibilidad

- **Foundry VTT 13**: compatible.
- **Foundry VTT 14**: verificado.
- **Sistema de juego**: agnóstico; diseñado para convivir con cualquier sistema sin registrar documentos propios.

## API

```js
game.mrLaUltimaEmision.openStation();
game.mrLaUltimaEmision.openListener();
game.mrLaUltimaEmision.toggleOverlay();
game.mrLaUltimaEmision.diagnostics();
game.mrLaUltimaEmision.resetWindowLayout();
```

## Identidad MR

Este proyecto forma parte de la familia de herramientas **MR-** para Foundry VTT. El prefijo se usa tanto en el nombre visible como en los repositorios para agrupar los proyectos de forma reconocible y consistente.

## Derechos y créditos

**Concepto, idea original y obra de La Última Llamada:**  
**MIDRA · Midespinas & Amdra**

**Implementación técnica del módulo para Foundry VTT:**  
**Manu Romera**

La licencia del repositorio se aplica exclusivamente al código de la implementación cuando corresponda. No transfiere ni concede derechos sobre la obra original de MIDRA, Midespinas & Amdra. Consulta [RIGHTS.md](RIGHTS.md) para el detalle completo.

---

<p align="center">
  <a href="https://github.com/ManuRomera">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ManuRomera/ManuRomera/main/brand/MR_09_Monograma_Marfil_Transparente.png">
      <img src="https://raw.githubusercontent.com/ManuRomera/ManuRomera/main/brand/MR_10_Monograma_Negro_Transparente.png" alt="MR · Manu Romera" height="56">
    </picture>
  </a><br>
  <sub>Hecho por <a href="https://github.com/ManuRomera"><b>Manu Romera</b></a> · Digital RPG Design</sub>
</p>
