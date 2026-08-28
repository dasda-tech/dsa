(() => {
  "use strict";

  const STORAGE_KEY = "ruti.fortnite.state";
  const BACKUP_KEY = "ruti.fortnite.backup";
  const RECOVERY_KEY = "ruti.fortnite.recovery";
  const SCHEMA_VERSION = 3;
  const PRESET_SCHEMA_VERSION = 1;

  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DAY_PLURALS = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
  const DAY_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const MONTH_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  const CATEGORIES = {
    aim: { label: "Aim", color: "#28d8ff" },
    edit: { label: "Edits", color: "#a77bff" },
    build: { label: "Builds", color: "#4f8dff" },
    fight: { label: "Realistics", color: "#ff7188" },
    ranked: { label: "Ranked", color: "#ffb13b" },
    vod: { label: "VOD", color: "#64ddb8" },
    break: { label: "Descanso", color: "#92a0b9" },
    other: { label: "Otro", color: "#d08cff" },
  };

  const refs = {};
  let state;
  let selectedDateKey;
  let visibleWeekStart;
  let noteSaveTimer;
  let toastTimer;
  let undoHandler = null;
  let confirmResolver = null;
  let startupMessage = "";
  let saveIndicatorTimer;
  let activeView = "today";
  let timerTicker = null;
  let reminderTicker = null;
  let onboardingQueued = false;
  let pendingFinish = null;
  let deferredInstallPrompt = null;
  let dataMenuReturnFocus = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    state = loadState();
    selectedDateKey = localDateKey(new Date());
    visibleWeekStart = startOfWeek(dateFromKey(selectedDateKey));
    bindEvents();
    setupInstallExperience();
    render();
    registerServiceWorker();
    setupCloudSync();
    startBackgroundLoops();
    window.requestAnimationFrame(() => scrollSelectedDayIntoView(false));

    if (!state.profile.onboardingDone) {
      onboardingQueued = true;
      window.setTimeout(() => {
        if (onboardingQueued && !document.querySelector("dialog[open]")) openProfileDialog(true);
      }, 700);
    }

    if (startupMessage) {
      window.setTimeout(() => showToast(startupMessage), 250);
    }
  }

  function cacheElements() {
    const ids = [
      "brandHome", "saveState", "profileButton", "profileAvatar", "profileName", "cloudAccountButton", "cloudAccountLabel", "cloudAccountHeaderStatus", "profileCloudButton", "profileCloudLabel", "dataMenuButton", "dataMenu", "installAppButton", "installAppLabel", "exportButton", "importButton", "shareBackupButton",
      "resetAppButton", "importFile", "heroSection", "todayEyebrow", "heroTitle", "heroSubtitle", "todayButton",
      "plannerViewButton", "planViewButton", "historyViewButton", "mobileProfileButton", "plannerView", "historyView", "profileView", "historyRange",
      "planHeader", "planAddTaskButton", "todayGoalChip", "weeklyGoalsPanel", "weeklyGoalsRange", "weeklyGoalGrid", "editWeeklyGoalsButton",
      "previousWeek", "nextWeek", "weekLabel", "weekGrid", "selectedDateLabel", "modeChip",
      "routineTitle", "addTaskButton", "progressLabel", "durationLabel", "progressBar", "progressFill",
      "tournamentBanner", "coachTip", "taskList", "emptyState", "emptyAddButton", "reviewSessionButton", "reviewSessionLabel", "routineOptionsButton", "saveTemplateButton",
      "restoreTemplateButton", "templateWeekday", "summaryRing", "weekMinutes", "weekCompleted",
      "weekTournaments", "tournamentPanel", "eventList", "eventEmpty", "addEventButton", "showAllEventsButton", "upcomingList", "dayNotes", "floatingAdd",
      "taskDialog", "taskForm", "taskDialogTitle", "taskId", "taskTitle", "taskCategory",
      "taskDuration", "taskNotes", "taskGoal", "taskRounds", "taskMapCode", "taskLink", "taskLinkError", "taskAdvancedDetails", "taskScopeField", "dayScopeDescription", "templateScopeOption",
      "templateScopeTitle", "taskTitleError", "taskDurationError", "deleteTaskButton", "eventDialog",
      "eventForm", "eventDialogTitle", "eventId", "eventName", "eventDate", "eventTime", "eventCheckIn", "eventFormat", "eventRegion", "eventTeammate", "eventRulesLink", "eventRulesError", "eventNotes",
      "eventCheckSetup", "eventCheckWater", "eventCheckDiscord", "eventCheckRules", "eventMatches", "eventPoints", "eventElims", "eventPlacement",
      "eventNameError", "eventDateError", "eventTimeError", "adaptOption", "adaptRoutine", "deleteEventButton", "exportEventButton",
      "reviewDialog", "reviewForm", "reviewDialogTitle", "reviewSummary", "focusRating", "focusError", "reviewFeeling", "reviewWin", "reviewError", "reviewNext", "reviewErrorTags",
      "routineToolsDialog", "presetGrid", "presetName", "savePresetButton", "shareCurrentPresetButton", "importPresetButton", "presetImportFile", "copyDayDate", "copyDayMode", "copyDayButton", "copyWeekButton", "fitRoutineButton",
      "profileDialog", "profileForm", "profileEyebrow", "profileDialogTitle", "playerName", "playerLevel", "playerPlatform", "playerInput", "playerRegion", "playerDailyMinutes", "playerGoal", "playerWeaknesses",
      "notificationPermissionButton", "notificationPermissionLabel", "routineReminderEnabled", "routineReminderTime", "tournamentReminderEnabled", "tournamentReminderLead", "hydrationReminderEnabled", "hydrationMinutes", "adaptProfileRoutine", "skipOnboardingButton",
      "openProfileEditorButton", "profileInstallButton", "profileInstallLabel", "profileDataMenuButton", "profileViewAvatar", "profileViewName", "profileViewMeta", "profileViewGoal", "profileViewWeaknesses", "profileViewTime", "profileViewReminders",
      "historyActual", "historyActualHint", "historyCompletion", "historyStreak", "historyFocus", "categoryChart", "trainingHeatmap", "errorSummary", "sessionList", "sessionDetailDialog", "sessionDetailTitle", "sessionDetailContent",
      "timerBar", "timerFocusButton", "activeTimerTask", "activeTimerGoal", "activeTimerElapsed", "activeTimerPlanned", "timerPauseButton", "timerFinishButton", "timerProgress",
      "focusDialog", "focusMinimizeButton", "focusCloseButton", "focusCategory", "focusTaskTitle", "focusElapsed", "focusPlanned", "focusProgress", "focusGoal", "focusMapBlock", "focusMapCode", "focusCopyMapButton", "focusRoundsBlock", "focusRoundsMinus", "focusRoundsPlus", "focusRoundsValue", "focusOpenLinkButton", "focusNotes", "focusPauseButton", "focusAddFiveButton", "focusFinishButton",
      "finishTaskDialog", "finishTaskForm", "finishTaskTitle", "finishTaskSummary", "finishActualMinutes", "finishTimeError", "finishRoundsField", "finishRoundsCompleted", "finishRating", "finishMarkDone", "finishContinueButton",
      "weeklyGoalsDialog", "weeklyGoalsForm", "weeklyGoalsDialogTitle", "weeklyTargetMinutes", "weeklyTargetDays", "weeklyFocusCategory", "weeklyFocusMinutes",
      "confirmDialog", "confirmTitle", "confirmMessage", "confirmAccept", "confirmCancel", "toast",
      "toastMessage", "toastAction", "celebration",
    ];

    for (const id of ids) refs[id] = document.getElementById(id);
  }

  function bindEvents() {
    refs.brandHome.addEventListener("click", (event) => {
      event.preventDefault();
      goToToday();
    });
    refs.todayButton.addEventListener("click", goToToday);
    refs.plannerViewButton.addEventListener("click", () => setActiveView("today"));
    refs.planViewButton.addEventListener("click", () => setActiveView("plan"));
    refs.historyViewButton.addEventListener("click", () => setActiveView("history"));
    refs.profileButton.addEventListener("click", () => openProfileDialog(false));
    refs.mobileProfileButton.addEventListener("click", () => setActiveView("profile"));
    refs.openProfileEditorButton.addEventListener("click", () => openProfileDialog(false));
    refs.installAppButton.addEventListener("click", installRuti);
    refs.profileInstallButton.addEventListener("click", installRuti);
    refs.profileDataMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openDataMenuFromProfile();
    });
    refs.previousWeek.addEventListener("click", () => changeWeek(-7));
    refs.nextWeek.addEventListener("click", () => changeWeek(7));

    refs.weekGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-date]");
      if (!button) return;
      selectDate(button.dataset.date);
    });

    refs.addTaskButton.addEventListener("click", () => openTaskDialog());
    refs.planAddTaskButton.addEventListener("click", () => openTaskDialog());
    refs.emptyAddButton.addEventListener("click", () => openTaskDialog());
    refs.floatingAdd.addEventListener("click", () => openTaskDialog());
    refs.taskForm.addEventListener("submit", handleTaskSubmit);
    refs.deleteTaskButton.addEventListener("click", handleTaskDelete);
    refs.taskList.addEventListener("click", handleTaskListClick);
    refs.saveTemplateButton.addEventListener("click", saveCurrentAsTemplate);
    refs.restoreTemplateButton.addEventListener("click", restoreTemplateForDay);
    refs.reviewSessionButton.addEventListener("click", openReviewDialog);
    refs.routineOptionsButton.addEventListener("click", openRoutineTools);

    refs.addEventButton.addEventListener("click", () => openEventDialog());
    refs.eventForm.addEventListener("submit", handleEventSubmit);
    refs.deleteEventButton.addEventListener("click", handleEventDelete);
    refs.exportEventButton.addEventListener("click", exportCurrentEventToCalendar);
    refs.eventList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-event-id]");
      if (button) openEventDialog(button.dataset.eventId);
    });
    refs.upcomingList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-event-id]");
      if (!button) return;
      const tournament = state.tournaments[button.dataset.eventId];
      if (tournament) selectDate(tournament.date);
      openEventDialog(button.dataset.eventId);
    });
    refs.showAllEventsButton.addEventListener("click", () => {
      const next = getUpcomingEvents()[0];
      if (next) selectDate(next.date);
      setActiveView("plan");
    });

    refs.tournamentBanner.addEventListener("click", (event) => {
      const action = event.target.closest("[data-banner-action]");
      if (!action) return;
      if (action.dataset.bannerAction === "edit") openEventDialog(action.dataset.eventId);
      if (action.dataset.bannerAction === "restore") restoreRoutineBackup();
    });
    refs.coachTip.addEventListener("click", handleCoachAction);

    refs.dayNotes.addEventListener("input", handleNotesInput);
    refs.dayNotes.addEventListener("blur", flushNotesSave);
    window.addEventListener("pagehide", flushNotesSave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNotesSave();
    });

    refs.dataMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDataMenu();
    });
    refs.dataMenu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", closeDataMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || refs.dataMenu.hidden) return;
      closeDataMenu();
      dataMenuReturnFocus?.focus();
    });
    refs.exportButton.addEventListener("click", exportBackup);
    refs.shareBackupButton.addEventListener("click", shareBackup);
    refs.importButton.addEventListener("click", () => {
      closeDataMenu();
      refs.importFile.click();
    });
    refs.importFile.addEventListener("change", importBackup);
    refs.resetAppButton.addEventListener("click", resetApplication);

    document.querySelectorAll(".close-dialog").forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog").close());
    });
    [refs.taskDialog, refs.eventDialog, refs.reviewDialog, refs.routineToolsDialog, refs.profileDialog, refs.sessionDetailDialog, refs.finishTaskDialog, refs.weeklyGoalsDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        if (dialog === refs.profileDialog && dialog.dataset.onboarding === "true") skipOnboarding();
        else dialog.close();
      });
    });
    refs.profileDialog.addEventListener("cancel", (event) => {
      if (refs.profileDialog.dataset.onboarding !== "true") return;
      event.preventDefault();
      skipOnboarding();
    });
    refs.focusDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      minimizeFocusMode();
    });
    refs.focusDialog.addEventListener("click", (event) => {
      if (event.target === refs.focusDialog) minimizeFocusMode();
    });
    refs.finishTaskDialog.addEventListener("close", () => {
      if (!refs.finishTaskDialog.open) pendingFinish = null;
    });

    refs.confirmCancel.addEventListener("click", () => resolveConfirm(false));
    refs.confirmAccept.addEventListener("click", () => resolveConfirm(true));
    refs.confirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveConfirm(false);
    });

    refs.toastAction.addEventListener("click", () => {
      if (typeof undoHandler === "function") undoHandler();
      hideToast();
    });

    refs.reviewForm.addEventListener("submit", handleReviewSubmit);
    refs.historyRange.addEventListener("change", renderHistory);
    refs.sessionList.addEventListener("click", (event) => {
      const item = event.target.closest("[data-session-date]");
      if (item) openSessionDetail(item.dataset.sessionDate);
    });

    refs.presetGrid.addEventListener("click", handlePresetGridClick);
    refs.savePresetButton.addEventListener("click", saveCustomPreset);
    refs.shareCurrentPresetButton.addEventListener("click", shareCurrentPreset);
    refs.importPresetButton.addEventListener("click", () => refs.presetImportFile.click());
    refs.presetImportFile.addEventListener("change", importPresetFile);
    refs.copyDayButton.addEventListener("click", copyCurrentDay);
    refs.copyWeekButton.addEventListener("click", copyCurrentWeek);
    refs.fitRoutineButton.addEventListener("click", fitSelectedRoutineToProfile);

    refs.profileForm.addEventListener("submit", handleProfileSubmit);
    refs.skipOnboardingButton.addEventListener("click", skipOnboarding);
    refs.notificationPermissionButton.addEventListener("click", requestNotificationPermission);

    refs.timerPauseButton.addEventListener("click", toggleActiveTimer);
    refs.timerFinishButton.addEventListener("click", finishActiveTimer);
    refs.timerFocusButton.addEventListener("click", openFocusMode);
    refs.focusMinimizeButton.addEventListener("click", minimizeFocusMode);
    refs.focusCloseButton.addEventListener("click", minimizeFocusMode);
    refs.focusPauseButton.addEventListener("click", toggleActiveTimer);
    refs.focusFinishButton.addEventListener("click", finishActiveTimer);
    refs.focusCopyMapButton.addEventListener("click", copyFocusMapCode);
    refs.focusOpenLinkButton.addEventListener("click", openFocusResource);
    refs.focusRoundsMinus.addEventListener("click", () => changeFocusRounds(-1));
    refs.focusRoundsPlus.addEventListener("click", () => changeFocusRounds(1));
    refs.focusAddFiveButton.addEventListener("click", addFiveMinutesToFocusedTask);

    refs.finishTaskForm.addEventListener("submit", handleFinishTaskSubmit);
    refs.finishContinueButton.addEventListener("click", continueFinishedTask);
    refs.finishTaskForm.addEventListener("click", handleFinishTimeAdjust);
    refs.editWeeklyGoalsButton.addEventListener("click", openWeeklyGoalsDialog);
    refs.weeklyGoalsForm.addEventListener("submit", handleWeeklyGoalsSubmit);

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        state = normalizeState(JSON.parse(event.newValue));
        render();
        updateTimerDisplay();
        showToast("Cambios actualizados desde otra pestaña");
      } catch {
        // Ignore malformed data written by another tab.
      }
    });
  }

  function createInitialState() {
    const now = new Date().toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      revision: 0,
      updatedAt: now,
      settings: { locale: "es-MX", weekStartsOn: 1, theme: "dark", recommendationDismissals: {} },
      profile: createDefaultProfile(),
      templates: createDefaultTemplates(now),
      dayPlans: {},
      tournaments: {},
      progress: {},
      activeTimer: null,
      reviews: {},
      routinePresets: createDefaultPresets(now),
      weeklyGoals: createDefaultWeeklyGoals(now),
      reminders: { fired: {} },
    };
  }

  function createDefaultProfile() {
    return {
      name: "", platform: "PC", input: "keyboard", skillLevel: "intermediate", region: "NA-Central",
      mainGoal: "", weaknesses: "", dailyMinutes: 90, onboardingDone: false,
      reminders: { routineEnabled: false, routineTime: "17:00", tournamentEnabled: false, tournamentLead: 60, hydrationEnabled: false, hydrationMinutes: 45 },
    };
  }

  function createDefaultWeeklyGoals(now) {
    const weekKey = localDateKey(startOfWeek(new Date()));
    return {
      [weekKey]: {
        targetMinutes: 300,
        targetDays: 4,
        focusCategory: "aim",
        focusMinutes: 60,
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  function createDefaultPresets(now) {
    const preset = (id, name, description, tasks) => ({ id, name, description, builtin: true, tasks: tasks.map((task) => createTask(...task)), createdAt: now, updatedAt: now });
    return {
      quick: preset("quick", "Rápida", "30 minutos para días con poco tiempo", [["Aim rápido", "aim", 10, "Activa la mano"], ["Edits útiles", "edit", 10, "Precisión"], ["Realistics", "fight", 10, "Peeks seguros"]]),
      full: preset("full", "Completa", "Mecánicas, peleas y aplicación", [["Aim completo", "aim", 20, "Tracking y shotgun"], ["Edits + piece control", "edit", 20, "Combos útiles"], ["Realistics", "fight", 30, "Peleas con intención"], ["Ranked", "ranked", 60, "Aplica lo practicado"]]),
      recovery: preset("recovery", "Recuperación", "Revisión ligera y descanso", [["VOD review", "vod", 20, "Un error repetido"], ["Práctica libre", "other", 20, "Sin presión"], ["Descanso", "break", 10, "Agua y movilidad"]]),
      tournament: preset("tournament", "Torneo", "Calentamiento corto para competir", [["Setup", "other", 10, "Conexión y periféricos"], ["Aim suave", "aim", 15, "Sin buscar récords"], ["Edits + piece control", "edit", 15, "Limpio y preciso"], ["Reset mental", "break", 10, "Agua y respiración"]]),
    };
  }

  function createDefaultTemplates(now) {
    const definitions = {
      1: [
        ["Activación de aim", "aim", 20, "Tracking, flicks y shotgun aim"],
        ["Edits consistentes", "edit", 15, "Prioriza precisión antes que velocidad"],
        ["Freebuild y retakes", "build", 20, "Movimiento limpio y piezas protegidas"],
        ["Realistics 1v1", "fight", 30, "Juega cada pelea con intención"],
        ["Ranked", "ranked", 60, "Aplica lo practicado sin mirar puntos"],
      ],
      2: [
        ["Shotgun aim", "aim", 15, "Crosshair placement y peek shots"],
        ["Piece control", "build", 25, "Rutas desde ambos lados"],
        ["Box fights", "fight", 35, "Evita intercambios innecesarios"],
        ["Ranked con objetivos", "ranked", 60, "Anota un error después de cada partida"],
      ],
      3: [
        ["Tracking", "aim", 20, "Movimiento suave y constante"],
        ["Edit course", "edit", 20, "Sin fallos, luego sube el ritmo"],
        ["Realistics", "fight", 35, "Practica el control de espacio"],
        ["Ranked", "ranked", 75, "Enfócate en decisiones de mid game"],
      ],
      4: [
        ["Calentamiento mixto", "aim", 15, "Aim y movimiento"],
        ["Freebuild", "build", 15, "Mecánicas que sí usas en partida"],
        ["Scrims", "ranked", 90, "Practica rotaciones y endgame"],
        ["Revisar una partida", "vod", 20, "Busca una decisión que puedas cambiar"],
      ],
      5: [
        ["Aim ligero", "aim", 15, "Calidad sobre cantidad"],
        ["Edits + piece control", "edit", 20, "Combos cortos y útiles"],
        ["Realistics", "fight", 30, "Peeks seguros"],
        ["Ranked / torneo", "ranked", 90, "Rutina flexible según eventos"],
      ],
      6: [
        ["Calentamiento completo", "aim", 25, "Tracking, flicks y shotgun"],
        ["Mecánicas", "build", 30, "Freebuild y piece control"],
        ["1v1 con amigos", "fight", 40, "Pide feedback entre peleas"],
        ["Sesión de ranked", "ranked", 120, "Descansa 5 min cada 3 partidas"],
      ],
      7: [
        ["VOD review semanal", "vod", 30, "Elige dos errores repetidos"],
        ["Práctica libre", "other", 30, "Juega algo que disfrutes"],
        ["Descanso y objetivos", "break", 15, "Prepara el foco de la próxima semana"],
      ],
    };

    const templates = {};
    for (let day = 1; day <= 7; day += 1) {
      templates[day] = {
        revision: 1,
        updatedAt: now,
        tasks: definitions[day].map(([title, category, duration, notes]) => createTask(title, category, duration, notes)),
      };
    }
    return templates;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      const normalized = normalizeState(parsed);
      const previousVersion = Math.max(1, Number(parsed.schemaVersion) || 1);
      if (previousVersion < SCHEMA_VERSION) {
        try {
          localStorage.setItem(`${BACKUP_KEY}.v${previousVersion}`, raw);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          startupMessage = `RUTI se actualizó a la versión ${SCHEMA_VERSION} sin perder tus datos`;
        } catch {
          startupMessage = `RUTI v${SCHEMA_VERSION} está lista; exporta un respaldo para proteger tus datos`;
        }
      }
      return normalized;
    } catch (error) {
      try {
        const broken = localStorage.getItem(STORAGE_KEY);
        if (broken) localStorage.setItem(RECOVERY_KEY, broken);
      } catch {
        // Storage may be unavailable; the app can still run for this session.
      }
      startupMessage = "No se pudo leer el guardado anterior; se creó uno nuevo";
      return createInitialState();
    }
  }

  function normalizeState(input) {
    if (!input || typeof input !== "object") throw new Error("Formato inválido");
    if (Number(input.schemaVersion) > SCHEMA_VERSION) {
      throw new Error("Este respaldo pertenece a una versión más reciente");
    }

    const fresh = createInitialState();
    const profileInput = isPlainObject(input.profile) ? input.profile : {};
    const profileReminders = isPlainObject(profileInput.reminders) ? profileInput.reminders : {};
    const normalized = {
      schemaVersion: SCHEMA_VERSION,
      revision: Number.isFinite(Number(input.revision)) ? Number(input.revision) : 0,
      updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : fresh.updatedAt,
      settings: {
        ...fresh.settings,
        ...(isPlainObject(input.settings) ? input.settings : {}),
        recommendationDismissals: isPlainObject(input.settings?.recommendationDismissals)
          ? Object.fromEntries(Object.entries(input.settings.recommendationDismissals).slice(0, 500).map(([key, value]) => [String(key).slice(0, 180), String(value).slice(0, 40)]))
          : {},
      },
      profile: {
        name: String(profileInput.name || profileInput.playerName || "").slice(0, 30),
        platform: String(profileInput.platform || "PC").slice(0, 30),
        input: ["keyboard", "controller", "touch"].includes(profileInput.input) ? profileInput.input : "keyboard",
        skillLevel: ["beginner", "intermediate", "competitive", "pro"].includes(profileInput.skillLevel) ? profileInput.skillLevel : "intermediate",
        region: String(profileInput.region || "NA-Central").slice(0, 30),
        mainGoal: String(profileInput.mainGoal || "").slice(0, 100),
        weaknesses: String(Array.isArray(profileInput.weaknesses) ? profileInput.weaknesses.join(", ") : profileInput.weaknesses || "").slice(0, 140),
        dailyMinutes: clamp(Number(profileInput.dailyMinutes) || 90, 15, 600),
        onboardingDone: Boolean(profileInput.onboardingDone),
        reminders: {
          routineEnabled: Boolean(profileReminders.routineEnabled),
          routineTime: validTime(profileReminders.routineTime) ? profileReminders.routineTime : "17:00",
          tournamentEnabled: Boolean(profileReminders.tournamentEnabled),
          tournamentLead: clamp(Number(profileReminders.tournamentLead) || 60, 1, 10080),
          hydrationEnabled: Boolean(profileReminders.hydrationEnabled),
          hydrationMinutes: clamp(Number(profileReminders.hydrationMinutes) || 45, 10, 240),
        },
      },
      templates: {},
      dayPlans: {},
      tournaments: {},
      progress: {},
      activeTimer: null,
      reviews: {},
      routinePresets: {},
      weeklyGoals: {},
      reminders: { fired: isPlainObject(input.reminders?.fired) ? { ...input.reminders.fired } : {} },
    };

    for (let day = 1; day <= 7; day += 1) {
      const source = input.templates?.[day];
      normalized.templates[day] = source && Array.isArray(source.tasks)
        ? {
            revision: Number(source.revision) || 1,
            updatedAt: source.updatedAt || normalized.updatedAt,
            tasks: source.tasks.map(normalizeTask).filter(Boolean),
          }
        : fresh.templates[day];
    }

    for (const [dateKey, sourcePlan] of Object.entries(isPlainObject(input.dayPlans) ? input.dayPlans : {})) {
      const plan = isPlainObject(sourcePlan) ? sourcePlan : null;
      if (!isDateKey(dateKey) || !plan || !Array.isArray(plan.tasks)) {
        continue;
      }
      const nextPlan = {
        reason: String(plan.reason || "custom").slice(0, 30),
        base: isPlainObject(plan.base) ? { ...plan.base } : { weekday: isoWeekday(dateFromKey(dateKey)), templateRevision: 1 },
        tasks: plan.tasks.map(normalizeTask).filter(Boolean),
        note: typeof plan.note === "string" ? plan.note.slice(0, 500) : "",
        createdAt: plan.createdAt || normalized.updatedAt,
        updatedAt: plan.updatedAt || normalized.updatedAt,
        tournamentPresetEventId: plan.tournamentPresetEventId ? String(plan.tournamentPresetEventId) : undefined,
      };
      if (Array.isArray(plan.backupTasks)) {
        nextPlan.backupTasks = plan.backupTasks.map(normalizeTask).filter(Boolean);
        nextPlan.backupProgress = normalizeProgressMap(plan.backupProgress);
      } else {
        nextPlan.backupTasks = null;
        nextPlan.backupProgress = null;
      }
      normalized.dayPlans[dateKey] = nextPlan;
    }

    for (const [id, sourceTournament] of Object.entries(isPlainObject(input.tournaments) ? input.tournaments : {})) {
      const tournament = isPlainObject(sourceTournament) ? sourceTournament : null;
      if (!tournament || !isDateKey(tournament.date)) {
        continue;
      }
      normalized.tournaments[id] = {
        id: String(tournament.id || id),
        name: String(tournament.name || "Torneo").slice(0, 70),
        date: tournament.date,
        startTime: validTime(tournament.startTime) ? tournament.startTime : "18:00",
        checkInTime: validTime(tournament.checkInTime) ? tournament.checkInTime : "",
        format: String(tournament.format || "Solo").slice(0, 20),
        region: String(tournament.region || "NA-Central").slice(0, 30),
        teammate: String(tournament.teammate || tournament.teammates?.join?.(", ") || "").slice(0, 60),
        rulesUrl: sanitizeUrl(tournament.rulesUrl || tournament.rulesLink || ""),
        notes: String(tournament.notes || "").slice(0, 220),
        status: ["scheduled", "completed", "cancelled"].includes(tournament.status) ? tournament.status : "scheduled",
        checklist: {
          setup: Boolean(tournament.checklist?.setup), water: Boolean(tournament.checklist?.water),
          discord: Boolean(tournament.checklist?.discord), rules: Boolean(tournament.checklist?.rules),
        },
        result: {
          matches: nullableInt(tournament.result?.matches), points: nullableInt(tournament.result?.points),
          eliminations: nullableInt(tournament.result?.eliminations), placement: nullableInt(tournament.result?.placement, 1),
        },
        createdAt: tournament.createdAt || normalized.updatedAt,
        updatedAt: tournament.updatedAt || normalized.updatedAt,
      };
    }

    if (isPlainObject(input.progress)) {
      for (const [dateKey, progressMap] of Object.entries(input.progress)) {
        if (isDateKey(dateKey)) normalized.progress[dateKey] = normalizeProgressMap(progressMap, dateKey, normalized);
      }
    }

    if (isPlainObject(input.activeTimer) && isDateKey(input.activeTimer.dateKey || input.activeTimer.date)) {
      const dateKey = input.activeTimer.dateKey || input.activeTimer.date;
      const taskId = String(input.activeTimer.taskId || "");
      const startedAt = Number(input.activeTimer.startedAt);
      const status = input.activeTimer.status === "paused" ? "paused" : "running";
      const validStartedAt = Number.isFinite(startedAt) && Date.now() - startedAt >= 0 && Date.now() - startedAt < 43200000;
      if (taskId && (status === "paused" || validStartedAt)) {
        normalized.activeTimer = { dateKey, taskId, status, startedAt: status === "running" ? startedAt : null };
      }
    }

    for (const [dateKey, review] of Object.entries(isPlainObject(input.reviews) ? input.reviews : {})) {
      if (!isDateKey(dateKey) || !isPlainObject(review)) continue;
      normalized.reviews[dateKey] = normalizeReview(review, dateKey);
    }

    const presetSource = isPlainObject(input.routinePresets) ? input.routinePresets : {};
    for (const [id, preset] of Object.entries({ ...fresh.routinePresets, ...presetSource })) {
      if (!preset || !Array.isArray(preset.tasks)) continue;
      normalized.routinePresets[id] = {
        id: String(preset.id || id), name: String(preset.name || "Plantilla").slice(0, 35),
        description: String(preset.description || "").slice(0, 100), builtin: Boolean(preset.builtin),
        tasks: preset.tasks.map(normalizeTask).filter(Boolean), createdAt: preset.createdAt || normalized.updatedAt, updatedAt: preset.updatedAt || normalized.updatedAt,
      };
    }

    const weeklyGoalSource = isPlainObject(input.weeklyGoals) ? input.weeklyGoals : fresh.weeklyGoals;
    for (const [sourceKey, sourceGoal] of Object.entries(weeklyGoalSource)) {
      if (!isDateKey(sourceKey) || !isPlainObject(sourceGoal)) continue;
      const weekKey = localDateKey(startOfWeek(dateFromKey(sourceKey)));
      normalized.weeklyGoals[weekKey] = normalizeWeeklyGoal(sourceGoal, normalized.updatedAt);
    }
    if (!Object.keys(normalized.weeklyGoals).length) normalized.weeklyGoals = clone(fresh.weeklyGoals);

    return normalized;
  }

  function normalizeWeeklyGoal(goal, fallbackDate = new Date().toISOString()) {
    return {
      targetMinutes: clamp(Number(goal.targetMinutes) || 0, 0, 5000),
      targetDays: clamp(Math.round(Number(goal.targetDays) || 0), 0, 7),
      focusCategory: CATEGORIES[goal.focusCategory] ? goal.focusCategory : "aim",
      focusMinutes: clamp(Number(goal.focusMinutes) || 0, 0, 5000),
      createdAt: typeof goal.createdAt === "string" ? goal.createdAt : fallbackDate,
      updatedAt: typeof goal.updatedAt === "string" ? goal.updatedAt : fallbackDate,
    };
  }

  function normalizeProgressMap(progressMap, dateKey = "", normalizedState = null) {
    if (!isPlainObject(progressMap)) return {};
    const normalized = {};
    for (const [taskId, entry] of Object.entries(progressMap)) {
      if (!taskId || !isPlainObject(entry)) continue;
      normalized[taskId] = {
        done: Boolean(entry.done),
        completedAt: typeof entry.completedAt === "string" ? entry.completedAt : null,
        actualSeconds: clamp(Number(entry.actualSeconds ?? entry.elapsedSeconds) || 0, 0, 43200),
        hasTimingData: Boolean(entry.hasTimingData || Number(entry.actualSeconds ?? entry.elapsedSeconds) > 0),
        firstStartedAt: typeof entry.firstStartedAt === "string" ? entry.firstStartedAt : null,
        lastStoppedAt: typeof entry.lastStoppedAt === "string" ? entry.lastStoppedAt : null,
        roundsCompleted: clamp(Number(entry.roundsCompleted) || 0, 0, 9999),
        sessionRating: ["normal", "excellent", "incomplete"].includes(entry.sessionRating) ? entry.sessionRating : "",
        correctedAt: typeof entry.correctedAt === "string" ? entry.correctedAt : null,
        archivedAt: typeof entry.archivedAt === "string" ? entry.archivedAt : null,
        taskSnapshot: isPlainObject(entry.taskSnapshot)
          ? normalizeTaskSnapshot(entry.taskSnapshot)
          : makeTaskSnapshot(findTaskInState(normalizedState, dateKey, taskId)),
      };
    }
    return normalized;
  }

  function normalizeTask(task) {
    if (!task || typeof task !== "object") return null;
    const title = String(task.title || "").trim().slice(0, 60);
    if (!title) return null;
    return {
      id: String(task.id || makeId("tsk")),
      title,
      category: CATEGORIES[task.category] ? task.category : "other",
      duration: clamp(Number(task.duration ?? task.durationMin) || 1, 1, 600),
      notes: String(task.notes || "").slice(0, 180),
      goal: String(task.goal || "").slice(0, 120),
      rounds: nullableInt(task.rounds),
      mapCode: String(task.mapCode || "").trim().slice(0, 24),
      link: sanitizeUrl(task.link || ""),
      ...(task.sourceTournamentId ? { sourceTournamentId: String(task.sourceTournamentId) } : {}),
    };
  }

  function normalizeTaskSnapshot(snapshot) {
    return {
      title: String(snapshot.title || "Tarea").slice(0, 60), category: CATEGORIES[snapshot.category] ? snapshot.category : "other",
      plannedMinutes: clamp(Number(snapshot.plannedMinutes ?? snapshot.duration) || 0, 0, 600), goal: String(snapshot.goal || "").slice(0, 120),
      mapCode: String(snapshot.mapCode || "").slice(0, 24), rounds: nullableInt(snapshot.rounds), link: sanitizeUrl(snapshot.link || ""),
      sourceTournamentId: snapshot.sourceTournamentId ? String(snapshot.sourceTournamentId) : "",
    };
  }

  function makeTaskSnapshot(task) {
    if (!task) return null;
    return normalizeTaskSnapshot({ title: task.title, category: task.category, plannedMinutes: task.duration, goal: task.goal, mapCode: task.mapCode, rounds: task.rounds, link: task.link, sourceTournamentId: task.sourceTournamentId });
  }

  function findTaskInState(candidateState, dateKey, taskId) {
    if (!candidateState || !dateKey) return null;
    const plan = candidateState.dayPlans?.[dateKey];
    const day = isoWeekday(dateFromKey(dateKey));
    return plan?.tasks?.find((task) => task.id === taskId)
      || plan?.backupTasks?.find((task) => task.id === taskId)
      || candidateState.templates?.[day]?.tasks?.find((task) => task.id === taskId)
      || null;
  }

  function normalizeReview(review, dateKey) {
    return {
      date: dateKey, focus: clamp(Number(review.focus) || 0, 0, 5), feeling: String(review.feeling || "neutral").slice(0, 20),
      wentWell: String(review.wentWell || review.win || "").slice(0, 240), wentWrong: String(review.wentWrong || review.error || "").slice(0, 240),
      nextFocus: String(review.nextFocus || review.next || "").slice(0, 180), mistakes: Array.isArray(review.mistakes) ? review.mistakes.map(String).slice(0, 12) : [],
      createdAt: review.createdAt || new Date().toISOString(), updatedAt: review.updatedAt || new Date().toISOString(),
    };
  }

  function persist({ quiet = false } = {}) {
    state.revision += 1;
    state.updatedAt = new Date().toISOString();
    if (!quiet) setSavingState(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      notifyCloudOfLocalChange();
      if (!quiet) {
        clearTimeout(saveIndicatorTimer);
        saveIndicatorTimer = window.setTimeout(() => setSavingState(false), 300);
      }
      return true;
    } catch (error) {
      setSavingState(false);
      showToast("No se pudo guardar. Exporta un respaldo para no perder cambios");
      return false;
    }
  }

  function setSavingState(isSaving) {
    refs.saveState.classList.toggle("saving", isSaving);
    refs.saveState.lastElementChild.textContent = isSaving ? "Guardando…" : "Guardado";
  }

  function setupCloudSync() {
    if (!window.RutiCloud || typeof window.RutiCloud.init !== "function") {
      renderCloudStatus({ configured: false, authenticated: false });
      return;
    }

    const cloudOptions = {
      getState: () => clone(state),
      applyState: applyCloudState,
      toast: (message) => showToast(String(message || "")),
      confirm: (options = {}) => askConfirm({
        title: options.title || "Sincronizar datos",
        message: options.message || "¿Quieres continuar?",
        acceptLabel: options.acceptLabel || "Continuar",
        dangerous: Boolean(options.dangerous),
      }),
      onStatus: renderCloudStatus,
    };

    try {
      const initialization = window.RutiCloud.init(cloudOptions);
      if (initialization && typeof initialization.catch === "function") {
        initialization.catch(() => renderCloudStatus({ configured: true, authenticated: false, error: true, message: "Nube no disponible" }));
      }
    } catch {
      renderCloudStatus({ configured: true, authenticated: false, error: true, message: "Nube no disponible" });
    }
  }

  function applyCloudState(remoteState) {
    const normalized = normalizeState(remoteState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    state = normalized;
    render();
    updateTimerDisplay();
    return clone(state);
  }

  function notifyCloudOfLocalChange() {
    try {
      window.RutiCloud?.notifyLocalChange?.(state);
    } catch {
      // Cloud sync is optional; local persistence must never depend on it.
    }
  }

  function renderCloudStatus(status = {}) {
    if (!refs.cloudAccountButton || !refs.profileCloudButton) return;
    const authenticated = Boolean(status.authenticated || status.signedIn || status.email || status.user?.email);
    const configured = status.configured !== false;
    const syncing = Boolean(status.syncing);
    const offline = status.online === false || status.offline === true;
    const error = Boolean(status.error);
    const email = String(status.email || status.user?.email || "");
    let stateName = "local";
    let headerStatus = configured ? "Sin conectar" : "Solo local";
    if (authenticated) {
      stateName = syncing ? "syncing" : offline ? "offline" : error ? "error" : "synced";
      headerStatus = syncing ? "Sincronizando…" : offline ? "Sin conexión" : error ? "Revisar sincronización" : "Sincronizado";
    } else if (error) {
      stateName = "error";
      headerStatus = status.message || "Nube no disponible";
    }
    refs.cloudAccountButton.dataset.state = stateName;
    refs.cloudAccountButton.classList.toggle("connected", authenticated && !error);
    refs.cloudAccountButton.classList.toggle("syncing", syncing);
    refs.cloudAccountButton.classList.toggle("offline", offline);
    refs.cloudAccountButton.classList.toggle("error", error);
    refs.cloudAccountLabel.textContent = authenticated ? (email.split("@")[0] || "Cuenta") : "Cuenta";
    refs.cloudAccountHeaderStatus.textContent = String(status.message || headerStatus).slice(0, 80);
    refs.profileCloudLabel.textContent = authenticated ? "Gestionar cuenta" : configured ? "Iniciar sesión" : "Configurar cuenta";
    refs.cloudAccountButton.setAttribute("aria-label", authenticated
      ? `Abrir cuenta y sincronización. ${headerStatus}`
      : `Abrir cuenta y sincronización. ${configured ? "Sin conectar" : "Modo local"}`);
  }

  function render() {
    renderNavigation();
    renderProfileHeader();
    renderProfileView();
    renderHero();
    renderWeek();
    renderRoutine();
    renderSummary();
    renderWeeklyGoals();
    renderEvents();
    renderNotes();
    renderHistory();
    renderTimerBar();
    updateNotificationStatus();
  }

  function renderNavigation() {
    const todayActive = activeView === "today";
    const planActive = activeView === "plan";
    const historyActive = activeView === "history";
    const profileActive = activeView === "profile";
    refs.plannerView.hidden = !(todayActive || planActive);
    refs.historyView.hidden = !historyActive;
    refs.profileView.hidden = !profileActive;
    refs.heroSection.hidden = !todayActive;
    refs.plannerView.classList.toggle("today-mode", todayActive);
    refs.plannerView.classList.toggle("plan-mode", planActive);
    const buttons = [
      [refs.plannerViewButton, todayActive],
      [refs.planViewButton, planActive],
      [refs.historyViewButton, historyActive],
      [refs.mobileProfileButton, profileActive],
    ];
    for (const [button, pressed] of buttons) {
      button.classList.toggle("active", pressed);
      button.setAttribute("aria-pressed", String(pressed));
    }
  }

  function setActiveView(view) {
    activeView = ["today", "plan", "history", "profile"].includes(view) ? view : "today";
    if (activeView === "today") {
      const today = new Date();
      selectedDateKey = localDateKey(today);
      visibleWeekStart = startOfWeek(today);
    }
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProfileHeader() {
    const name = state.profile.name.trim() || "Jugador";
    refs.profileName.textContent = name;
    refs.profileAvatar.textContent = name.charAt(0).toUpperCase();
  }

  function renderProfileView() {
    const profile = state.profile;
    const name = profile.name.trim() || "Jugador";
    const inputLabels = { keyboard: "Teclado y mouse", controller: "Mando", touch: "Táctil" };
    const levelLabels = { beginner: "Principiante", intermediate: "Intermedio", competitive: "Competitivo", pro: "Profesional" };
    refs.profileViewAvatar.textContent = name.charAt(0).toUpperCase();
    refs.profileViewName.textContent = name;
    refs.profileViewMeta.textContent = `${profile.platform} · ${inputLabels[profile.input] || profile.input} · ${levelLabels[profile.skillLevel] || profile.skillLevel}`;
    refs.profileViewGoal.textContent = profile.mainGoal || "Aún no definido";
    refs.profileViewWeaknesses.textContent = profile.weaknesses
      ? `Puntos débiles: ${profile.weaknesses}`
      : "Añade tus puntos débiles para recibir mejores recomendaciones.";
    refs.profileViewTime.textContent = `${formatMinutes(profile.dailyMinutes)} al día`;
    const enabled = [
      profile.reminders.routineEnabled ? "rutina" : "",
      profile.reminders.tournamentEnabled ? "torneos" : "",
      profile.reminders.hydrationEnabled ? "descansos" : "",
    ].filter(Boolean);
    refs.profileViewReminders.textContent = enabled.length ? `Recordatorios: ${enabled.join(", ")}` : "Recordatorios desactivados";
  }

  function renderHero() {
    const date = dateFromKey(selectedDateKey);
    const todayKey = localDateKey(new Date());
    const events = getEventsForDate(selectedDateKey);
    const stats = getDayStats(selectedDateKey);

    refs.heroTitle.replaceChildren();
    const normalText = document.createTextNode(
      selectedDateKey === todayKey ? "Hoy toca " : events.length ? "Día de " : "Plan para el "
    );
    const accent = document.createElement("span");
    accent.textContent = selectedDateKey === todayKey
      ? "mejorar."
      : events.length
        ? "torneo."
        : `${DAY_NAMES[date.getDay()]}.`;
    refs.heroTitle.append(normalText, accent);

    if (selectedDateKey === todayKey) {
      refs.todayEyebrow.textContent = "TU PLAN DE HOY";
    } else {
      refs.todayEyebrow.textContent = selectedDateKey < todayKey ? "DÍA ANTERIOR" : "PRÓXIMO ENTRENAMIENTO";
    }

    if (stats.total > 0 && stats.completed === stats.total) {
      refs.heroSubtitle.textContent = "Rutina completada. Buen trabajo; ahora toca recuperar.";
    } else if (events.length) {
      refs.heroSubtitle.textContent = `${events[0].name} a las ${events[0].startTime}. Entra preparado, no cansado.`;
    } else if (stats.total > 0) {
      refs.heroSubtitle.textContent = `${stats.total - stats.completed} ${stats.total - stats.completed === 1 ? "tarea pendiente" : "tareas pendientes"} · ${formatMinutes(stats.remainingMinutes)} por delante.`;
    } else {
      refs.heroSubtitle.textContent = "Día libre. También se mejora descansando.";
    }

    refs.todayButton.hidden = selectedDateKey === todayKey;
  }

  function renderWeek() {
    refs.weekLabel.textContent = formatWeekRange(visibleWeekStart);
    refs.weekGrid.replaceChildren();
    const todayKey = localDateKey(new Date());

    for (let index = 0; index < 7; index += 1) {
      const date = addDays(visibleWeekStart, index);
      const dateKey = localDateKey(date);
      const stats = getDayStats(dateKey);
      const events = getEventsForDate(dateKey);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day-button";
      button.dataset.date = dateKey;
      button.setAttribute("aria-pressed", String(dateKey === selectedDateKey));
      button.setAttribute("aria-label", `${DAY_NAMES[date.getDay()]} ${date.getDate()}, ${stats.completed} de ${stats.total} tareas${events.length ? `, ${events.length} torneo` : ""}`);
      button.style.setProperty("--day-progress", stats.total ? String(stats.completed / stats.total) : "0");
      if (dateKey === todayKey) button.classList.add("today");

      const name = document.createElement("span");
      name.className = "day-name";
      name.textContent = DAY_SHORT[date.getDay()];
      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(date.getDate());
      const indicators = document.createElement("span");
      indicators.className = "day-indicators";

      if (stats.total && stats.completed === stats.total) {
        const dot = document.createElement("span");
        dot.className = "day-dot";
        dot.title = "Rutina completada";
        indicators.append(dot);
      }
      if (events.length) {
        const trophy = document.createElement("span");
        trophy.className = "day-trophy";
        trophy.title = "Día de torneo";
        trophy.append(makeIcon("trophy"));
        indicators.append(trophy);
      }

      button.append(name, number, indicators);
      refs.weekGrid.append(button);
    }
  }

  function renderRoutine() {
    const date = dateFromKey(selectedDateKey);
    const tasks = getEffectiveTasks(selectedDateKey);
    const stats = getDayStats(selectedDateKey);
    const plan = state.dayPlans[selectedDateKey];

    refs.selectedDateLabel.textContent = formatLongDate(date).toUpperCase();
    refs.routineTitle.textContent = `Rutina del ${DAY_NAMES[date.getDay()]}`;
    refs.templateWeekday.textContent = DAY_PLURALS[date.getDay()];
    refs.progressLabel.textContent = `${stats.completed} de ${stats.total} ${stats.total === 1 ? "completada" : "completadas"}`;
    refs.durationLabel.textContent = `${formatMinutes(stats.totalMinutes)} planeados`;
    refs.progressFill.style.width = `${stats.percent}%`;
    refs.progressBar.setAttribute("aria-valuenow", String(stats.percent));
    refs.progressBar.classList.toggle("complete", stats.total > 0 && stats.completed === stats.total);
    refs.reviewSessionLabel.textContent = state.reviews[selectedDateKey] ? "Ver revisión" : "Cerrar sesión";
    refs.reviewSessionButton.hidden = !(stats.actualSeconds > 0 || stats.completed > 0 || state.reviews[selectedDateKey]);

    const mode = plan?.backupTasks
      ? { text: "RUTINA DE TORNEO", className: "tournament" }
      : plan
        ? { text: "PERSONALIZADA", className: "custom" }
        : { text: "RUTINA BASE", className: "" };
    refs.modeChip.textContent = mode.text;
    refs.modeChip.className = `mode-chip ${mode.className}`.trim();

    renderTournamentBanner();
    renderCoachTip();
    refs.taskList.replaceChildren();
    refs.emptyState.hidden = tasks.length > 0;
    refs.taskList.hidden = tasks.length === 0;

    tasks.forEach((task, index) => refs.taskList.append(createTaskCard(task, index, tasks.length)));
  }

  function renderCoachTip() {
    refs.coachTip.replaceChildren();
    const recommendation = activeView === "today" ? getDeterministicRecommendation(selectedDateKey) : null;
    refs.coachTip.classList.toggle("recommendation-card", Boolean(recommendation));
    refs.coachTip.hidden = !recommendation;
    if (!recommendation) {
      delete refs.coachTip.dataset.recommendation;
      return;
    }
    refs.coachTip.dataset.recommendation = JSON.stringify(recommendation);
    const icon = document.createElement("span");
    icon.className = "coach-icon";
    icon.append(makeIcon(recommendation.icon || "target"));
    const copy = document.createElement("div");
    copy.className = "recommendation-copy";
    const label = document.createElement("small");
    label.textContent = recommendation.reason.toUpperCase();
    const text = document.createElement("strong");
    text.textContent = recommendation.text;
    copy.append(label, text);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.dataset.coachAction = "primary";
    button.textContent = recommendation.actionLabel;
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "task-mini-button coach-dismiss";
    dismiss.dataset.coachAction = "dismiss";
    dismiss.setAttribute("aria-label", "Descartar recomendación");
    dismiss.append(makeIcon("close"));
    const actions = document.createElement("div");
    actions.className = "recommendation-actions";
    actions.append(button, dismiss);
    refs.coachTip.append(icon, copy, actions);
  }

  function getDeterministicRecommendation(dateKey) {
    const dismissals = state.settings.recommendationDismissals || {};
    const accept = (recommendation) => dismissals[recommendation.key] ? null : recommendation;
    const events = getEventsForDate(dateKey).filter((event) => event.status === "scheduled");
    const event = events[0];
    if (event) {
      const adapted = state.dayPlans[dateKey]?.tournamentPresetEventId === event.id;
      if (!adapted) {
        return accept({ key: `${dateKey}:tournament:${event.id}:warmup`, type: "apply-tournament", eventId: event.id, icon: "trophy", reason: "Torneo hoy", text: `Prepara un calentamiento corto para ${event.name}.`, actionLabel: "Aplicar calentamiento" });
      }
      const checked = Object.values(event.checklist || {}).filter(Boolean).length;
      if (checked < 4) {
        return accept({ key: `${dateKey}:tournament:${event.id}:checklist`, type: "edit-event", eventId: event.id, icon: "trophy", reason: "Torneo hoy", text: `Completa el checklist de ${event.name} (${checked}/4).`, actionLabel: "Abrir checklist" });
      }
    }

    const dayStats = getDayStats(dateKey);
    if (state.profile.dailyMinutes > 0 && dayStats.totalMinutes > state.profile.dailyMinutes) {
      return accept({ key: `${dateKey}:time:${state.profile.dailyMinutes}:${dayStats.totalMinutes}`, type: "adjust", icon: "clock", reason: "Según tu perfil", text: `Planeaste ${dayStats.totalMinutes} min y tienes ${state.profile.dailyMinutes} min disponibles.`, actionLabel: "Ajustar rutina" });
    }

    const recentReviews = Object.entries(state.reviews)
      .filter(([reviewDate]) => reviewDate < dateKey)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5);
    const latestReview = recentReviews[0]?.[1];
    if (latestReview && ["tired", "frustrated"].includes(latestReview.feeling)) {
      return accept({ key: `${dateKey}:recovery:${recentReviews[0][0]}`, type: "apply-preset", presetId: "recovery", icon: "note", reason: "Por tu última revisión", text: "Baja la carga y prioriza una sesión de recuperación.", actionLabel: "Aplicar recuperación" });
    }

    const mistakeCounts = {};
    for (const [, review] of recentReviews) {
      for (const mistake of review.mistakes || []) mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
    }
    const repeated = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).find(([, count]) => count >= 2);
    if (repeated) {
      const task = recommendationTaskForText(repeated[0], `Trabaja ${repeated[0]} con una intención concreta.`);
      return accept({ key: `${dateKey}:mistake:${repeated[0]}:${repeated[1]}`, type: "add", task, icon: "target", reason: `Apareció en ${repeated[1]} revisiones`, text: task.goal, actionLabel: "Añadir a hoy" });
    }

    if (latestReview?.nextFocus) {
      const task = recommendationTaskForText(latestReview.nextFocus, latestReview.nextFocus);
      return accept({ key: `${dateKey}:next:${recentReviews[0][0]}:${latestReview.nextFocus}`, type: "add", task, icon: "target", reason: "Tu siguiente foco", text: latestReview.nextFocus, actionLabel: "Añadir a hoy" });
    }

    const weekStart = startOfWeek(dateFromKey(dateKey));
    const weekKey = localDateKey(weekStart);
    const goal = state.weeklyGoals[weekKey];
    if (goal?.focusMinutes > 0) {
      const goalStats = getWeeklyGoalStats(weekStart, goal);
      if (goalStats.focusSeconds < goal.focusMinutes * 60) {
        const category = goal.focusCategory;
        const label = CATEGORIES[category]?.label || "tu categoría foco";
        const task = { title: `Foco semanal: ${label}`, category, duration: 15, goal: `Acércate a tu objetivo semanal de ${goal.focusMinutes} min en ${label}.` };
        return accept({ key: `${weekKey}:goal:${category}:${goal.focusMinutes}`, type: "add", task, icon: "target", reason: "Objetivo semanal pendiente", text: `Aún te faltan ${formatGoalSeconds(goal.focusMinutes * 60 - goalStats.focusSeconds)} de ${label}.`, actionLabel: "Añadir 15 min" });
      }
    }

    const weaknessText = state.profile.weaknesses || state.profile.mainGoal;
    if (weaknessText) {
      const task = recommendationTaskForText(weaknessText, `Trabaja uno de tus puntos débiles: ${weaknessText}`);
      return accept({ key: `${dateKey}:profile:${task.category}:${weaknessText}`, type: "add", task, icon: "user", reason: "Según tu perfil", text: task.goal, actionLabel: "Añadir a hoy" });
    }
    return null;
  }

  function recommendationTaskForText(value, goal) {
    const text = String(value || "").toLowerCase();
    let category = "other";
    if (/aim|punter|precisi|flick|tracking/.test(text)) category = "aim";
    else if (/peek|fight|pelea|box/.test(text)) category = "fight";
    else if (/build|constru|piece|retake/.test(text)) category = "build";
    else if (/edit/.test(text)) category = "edit";
    else if (/rotaci|decisi|vod|macro/.test(text)) category = "vod";
    else if (/mental|nerv|calma|descans/.test(text)) category = "break";
    else if (/ranked|scrim|torneo/.test(text)) category = "ranked";
    return { title: `Práctica de ${CATEGORIES[category]?.label || "foco"}`, category, duration: 15, goal: String(goal || value).slice(0, 120) };
  }

  function handleCoachAction(event) {
    const actionButton = event.target.closest("[data-coach-action]");
    if (!actionButton) return;
    let recommendation;
    try { recommendation = JSON.parse(refs.coachTip.dataset.recommendation || "null"); } catch { return; }
    if (!recommendation) return;
    if (actionButton.dataset.coachAction === "dismiss") {
      state.settings.recommendationDismissals ||= {};
      state.settings.recommendationDismissals[recommendation.key] = new Date().toISOString();
      persist({ quiet: true });
      renderCoachTip();
      showToast("Recomendación descartada");
      return;
    }
    if (recommendation.type === "adjust") {
      fitSelectedRoutineToProfile();
      return;
    }
    if (recommendation.type === "apply-preset") {
      applyPresetById(recommendation.presetId);
      return;
    }
    if (recommendation.type === "edit-event") {
      openEventDialog(recommendation.eventId);
      return;
    }
    if (recommendation.type === "apply-tournament") {
      const tournament = state.tournaments[recommendation.eventId];
      if (!tournament) return;
      applyTournamentPreset(tournament);
      persist();
      render();
      showToast("Calentamiento de torneo aplicado");
      return;
    }
    if (recommendation.type === "add") {
      state.settings.recommendationDismissals ||= {};
      state.settings.recommendationDismissals[recommendation.key] = new Date().toISOString();
      persist({ quiet: true });
      openTaskDialog();
      refs.taskTitle.value = recommendation.task.title.slice(0, 60);
      refs.taskCategory.value = recommendation.task.category;
      refs.taskDuration.value = String(recommendation.task.duration || 15);
      refs.taskGoal.value = recommendation.task.goal.slice(0, 120);
      refs.taskAdvancedDetails.open = true;
    }
  }

  function createTaskCard(task, index, total) {
    const progress = state.progress[selectedDateKey]?.[task.id];
    const done = Boolean(progress?.done && !progress?.archivedAt);
    const active = state.activeTimer?.dateKey === selectedDateKey && state.activeTimer?.taskId === task.id;
    const category = CATEGORIES[task.category] || CATEGORIES.other;
    const card = document.createElement("article");
    card.className = `task-card${done ? " completed" : ""}${active ? " active-timer" : ""}${activeView === "plan" ? " planning-card" : ""}`;
    card.dataset.taskId = task.id;
    card.style.setProperty("--task-color", category.color);

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = `task-checkbox${done ? " checked" : ""}`;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("role", "checkbox");
    checkbox.setAttribute("aria-checked", String(done));
    checkbox.setAttribute("aria-label", `${done ? "Marcar pendiente" : "Completar"}: ${task.title}`);
    checkbox.append(makeIcon("check"));

    const main = document.createElement("div");
    main.className = "task-main";
    const topline = document.createElement("div");
    topline.className = "task-topline";
    const pill = document.createElement("span");
    pill.className = "category-pill";
    pill.textContent = category.label;
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    topline.append(pill, title);
    main.append(topline);
    if (task.goal || task.notes) {
      const note = document.createElement("p");
      note.className = "task-note";
      note.textContent = task.goal || task.notes;
      main.append(note);
    }

    if (task.rounds || task.mapCode || task.link || progress?.actualSeconds) {
      const details = document.createElement("div");
      details.className = "task-details-row";
      if (task.rounds) {
        const rounds = document.createElement("span");
        rounds.className = "task-chip";
        rounds.textContent = `${task.rounds} rondas`;
        details.append(rounds);
      }
      if (task.mapCode) {
        const map = document.createElement("button");
        map.type = "button";
        map.className = "task-chip map-chip";
        map.dataset.action = "copy-code";
        map.dataset.code = task.mapCode;
        map.append(makeIcon("copy"), document.createTextNode(task.mapCode));
        map.setAttribute("aria-label", `Copiar código ${task.mapCode}`);
        details.append(map);
      }
      if (task.link) {
        const link = document.createElement("button");
        link.type = "button";
        link.className = "task-chip link-chip";
        link.dataset.action = "open-link";
        link.dataset.link = task.link;
        link.append(makeIcon("external"), document.createTextNode("Abrir recurso"));
        details.append(link);
      }
      if (progress?.actualSeconds) {
        const actual = document.createElement("span");
        actual.className = "task-chip task-actual-time";
        actual.textContent = `${formatTimer(progress.actualSeconds)} real`;
        details.append(actual);
      }
      main.append(details);
    }

    const duration = document.createElement("span");
    duration.className = "task-duration";
    duration.append(makeIcon("clock"));
    const durationText = document.createElement("span");
    durationText.textContent = formatMinutes(task.duration);
    duration.append(durationText);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const reorder = document.createElement("div");
    reorder.className = "reorder-buttons";
    reorder.append(
      makeMiniButton("arrow-up", "move-up", "Subir tarea", index === 0),
      makeMiniButton("arrow-down", "move-down", "Bajar tarea", index === total - 1),
    );
    const edit = makeMiniButton("edit", "edit", `Editar ${task.title}`);
    const timer = makeMiniButton(active && state.activeTimer?.status === "running" ? "pause" : "play", "timer", active && state.activeTimer?.status === "running" ? `Pausar ${task.title}` : `Iniciar ${task.title}`);
    timer.classList.add("task-timer-button");
    const log = makeMiniButton("clock", "log", `Registrar tiempo de ${task.title}`);
    log.classList.add("task-log-button");
    if (activeView === "plan") actions.append(reorder, edit);
    else actions.append(timer, log, edit);

    if (activeView === "plan") card.append(main, duration, actions);
    else card.append(checkbox, main, duration, actions);
    return card;
  }

  function makeMiniButton(iconName, action, label, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-mini-button";
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.disabled = disabled;
    button.append(makeIcon(iconName));
    return button;
  }

  function renderTournamentBanner() {
    const events = getEventsForDate(selectedDateKey);
    const plan = state.dayPlans[selectedDateKey];
    const shouldShow = events.length > 0 || Boolean(plan?.backupTasks);
    refs.tournamentBanner.hidden = !shouldShow;
    refs.tournamentBanner.replaceChildren();
    if (!shouldShow) return;

    const event = events[0];
    const main = document.createElement("div");
    main.className = "banner-main";
    const icon = document.createElement("span");
    icon.className = "banner-icon";
    icon.append(makeIcon("trophy"));
    const copy = document.createElement("div");
    copy.className = "banner-copy";
    const title = document.createElement("strong");
    title.textContent = event ? event.name : "Rutina de torneo personalizada";
    const meta = document.createElement("small");
    meta.textContent = event
      ? `${event.startTime} · ${event.format}${events.length > 1 ? ` · +${events.length - 1} más` : ""}`
      : "El evento se eliminó, pero conservamos tus tareas";
    copy.append(title, meta);
    main.append(icon, copy);

    const actions = document.createElement("div");
    actions.className = "banner-actions";
    if (event) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "banner-action";
      edit.dataset.bannerAction = "edit";
      edit.dataset.eventId = event.id;
      edit.textContent = "Editar";
      actions.append(edit);
    }
    if (plan?.backupTasks) {
      const restore = document.createElement("button");
      restore.type = "button";
      restore.className = "banner-action";
      restore.dataset.bannerAction = "restore";
      restore.textContent = "Rutina normal";
      actions.append(restore);
    }

    refs.tournamentBanner.append(main, actions);
  }

  function renderSummary() {
    const days = Array.from({ length: 7 }, (_, index) => localDateKey(addDays(visibleWeekStart, index)));
    let total = 0;
    let completed = 0;
    let actualSeconds = 0;

    for (const dateKey of days) {
      const stats = getDayStats(dateKey);
      total += stats.total;
      completed += stats.completed;
      actualSeconds += stats.actualSeconds;
    }

    const tournaments = Object.values(state.tournaments).filter((event) => days.includes(event.date)).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    refs.weekMinutes.textContent = String(Math.round(actualSeconds / 60));
    refs.weekCompleted.textContent = String(completed);
    refs.weekTournaments.textContent = String(tournaments);
    refs.summaryRing.style.setProperty("--ring-progress", `${percent * 3.6}deg`);
    refs.summaryRing.firstElementChild.textContent = `${percent}%`;
  }

  function getWeeklyGoalStats(weekStart, goal) {
    let actualSeconds = 0;
    let activeDays = 0;
    let focusSeconds = 0;
    for (let index = 0; index < 7; index += 1) {
      const dateKey = localDateKey(addDays(weekStart, index));
      const stats = getDayStats(dateKey);
      const history = getHistoryDayData(dateKey);
      actualSeconds += history.actualSeconds;
      focusSeconds += history.categorySeconds[goal.focusCategory] || 0;
      if (history.actualSeconds >= 300 || stats.completed > 0) activeDays += 1;
    }
    return { actualSeconds, activeDays, focusSeconds };
  }

  function renderWeeklyGoals() {
    const planWeekStart = startOfWeek(visibleWeekStart);
    const weekKey = localDateKey(planWeekStart);
    const goal = state.weeklyGoals[weekKey];
    refs.weeklyGoalsRange.textContent = formatWeekRange(planWeekStart);
    refs.weeklyGoalGrid.replaceChildren();
    if (!goal) {
      const empty = document.createElement("p");
      empty.className = "analytics-empty";
      empty.textContent = "Define objetivos para medir esta semana con tu tiempo real.";
      refs.weeklyGoalGrid.append(empty);
    } else {
      const stats = getWeeklyGoalStats(planWeekStart, goal);
      refs.weeklyGoalGrid.append(
        makeWeeklyGoalCard("clock", "Tiempo real", formatGoalSeconds(stats.actualSeconds), `${formatMinutes(goal.targetMinutes)} objetivo`, goal.targetMinutes ? stats.actualSeconds / (goal.targetMinutes * 60) : 0),
        makeWeeklyGoalCard("calendar", "Días activos", `${stats.activeDays} días`, `${goal.targetDays} objetivo`, goal.targetDays ? stats.activeDays / goal.targetDays : 0),
        makeWeeklyGoalCard("target", CATEGORIES[goal.focusCategory]?.label || "Categoría foco", formatGoalSeconds(stats.focusSeconds), `${formatMinutes(goal.focusMinutes)} objetivo`, goal.focusMinutes ? stats.focusSeconds / (goal.focusMinutes * 60) : 0),
      );
    }

    const todayStart = startOfWeek(new Date());
    const todayKey = localDateKey(todayStart);
    const todayGoal = state.weeklyGoals[todayKey];
    if (!todayGoal) {
      refs.todayGoalChip.textContent = "Semana: sin objetivos configurados";
    } else {
      const todayStats = getWeeklyGoalStats(todayStart, todayGoal);
      refs.todayGoalChip.textContent = `Semana: ${formatGoalSeconds(todayStats.actualSeconds)} / ${formatMinutes(todayGoal.targetMinutes)} · ${todayStats.activeDays}/${todayGoal.targetDays} días`;
    }
  }

  function makeWeeklyGoalCard(iconName, label, value, target, ratio) {
    const card = document.createElement("article");
    card.className = "weekly-goal-card";
    const icon = document.createElement("span");
    icon.className = "stat-icon cyan";
    icon.append(makeIcon(iconName));
    const copy = document.createElement("div");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    const hint = document.createElement("span");
    hint.textContent = target;
    const track = document.createElement("span");
    track.className = "weekly-goal-progress";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    track.append(fill);
    copy.append(small, strong, hint, track);
    card.append(icon, copy);
    return card;
  }

  function formatGoalSeconds(seconds) {
    const minutes = Math.max(0, Number(seconds) || 0) / 60;
    if (minutes > 0 && minutes < 1) return "<1 min";
    const rounded = Math.round(minutes * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} min`;
  }

  function openWeeklyGoalsDialog() {
    const weekStart = activeView === "plan" ? startOfWeek(visibleWeekStart) : startOfWeek(new Date());
    const weekKey = localDateKey(weekStart);
    const goal = state.weeklyGoals[weekKey] || normalizeWeeklyGoal({ targetMinutes: 300, targetDays: 4, focusCategory: "aim", focusMinutes: 60 });
    refs.weeklyGoalsDialog.dataset.weekKey = weekKey;
    refs.weeklyGoalsDialogTitle.textContent = `Objetivos · ${formatWeekRange(weekStart)}`;
    refs.weeklyTargetMinutes.value = String(goal.targetMinutes);
    refs.weeklyTargetDays.value = String(goal.targetDays);
    refs.weeklyFocusCategory.value = goal.focusCategory;
    refs.weeklyFocusMinutes.value = String(goal.focusMinutes);
    showModal(refs.weeklyGoalsDialog);
  }

  function handleWeeklyGoalsSubmit(event) {
    event.preventDefault();
    const weekKey = refs.weeklyGoalsDialog.dataset.weekKey;
    if (!isDateKey(weekKey)) return;
    const previous = state.weeklyGoals[weekKey];
    const now = new Date().toISOString();
    state.weeklyGoals[weekKey] = normalizeWeeklyGoal({
      targetMinutes: refs.weeklyTargetMinutes.value,
      targetDays: refs.weeklyTargetDays.value,
      focusCategory: refs.weeklyFocusCategory.value,
      focusMinutes: refs.weeklyFocusMinutes.value,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    }, now);
    refs.weeklyGoalsDialog.close();
    persist();
    render();
    showToast("Objetivos semanales guardados");
  }

  function renderEvents() {
    const events = getEventsForDate(selectedDateKey);
    refs.eventList.replaceChildren();
    refs.eventEmpty.hidden = events.length > 0;
    refs.eventList.hidden = events.length === 0;

    for (const event of events) {
      const card = document.createElement("article");
      card.className = "event-card";
      const title = document.createElement("strong");
      title.textContent = event.name;
      const meta = document.createElement("div");
      meta.className = "event-meta";
      meta.append(makeIcon("clock"));
      const metaText = document.createElement("span");
      metaText.textContent = `${event.startTime} · ${event.format} · ${event.region}`;
      meta.append(metaText);
      card.append(title, meta);
      if (event.checkInTime) {
        const checkIn = document.createElement("small");
        checkIn.className = "event-checkin";
        checkIn.textContent = `Check-in ${event.checkInTime}`;
        card.append(checkIn);
      }
      const checked = Object.values(event.checklist || {}).filter(Boolean).length;
      if (checked) {
        const checklist = document.createElement("small");
        checklist.className = "checklist-progress";
        checklist.textContent = `Checklist ${checked}/4`;
        card.append(checklist);
      }
      if (event.status === "completed") {
        const result = document.createElement("small");
        result.className = "event-result";
        result.textContent = [
          event.result?.points !== null ? `${event.result.points} pts` : "",
          event.result?.eliminations !== null ? `${event.result.eliminations} elims` : "",
          event.result?.placement !== null ? `puesto ${event.result.placement}` : "",
        ].filter(Boolean).join(" · ") || "Resultado registrado";
        card.append(result);
      }
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "task-mini-button event-edit";
      edit.dataset.eventId = event.id;
      edit.setAttribute("aria-label", `Editar torneo ${event.name}`);
      edit.append(makeIcon("edit"));
      card.append(edit);
      refs.eventList.append(card);
    }
    renderUpcomingEvents();
    refs.tournamentPanel.hidden = activeView === "today" && events.length === 0 && getUpcomingEvents().length === 0;
  }

  function renderUpcomingEvents() {
    refs.upcomingList.replaceChildren();
    const upcoming = getUpcomingEvents().slice(0, 3);
    if (!upcoming.length) {
      const empty = document.createElement("p");
      empty.className = "upcoming-empty";
      empty.textContent = "Sin próximos torneos";
      refs.upcomingList.append(empty);
      return;
    }
    for (const event of upcoming) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "upcoming-card";
      button.dataset.eventId = event.id;
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = event.name;
      const date = document.createElement("small");
      date.textContent = `${formatShortDate(dateFromKey(event.date))} · ${event.startTime}`;
      copy.append(title, date);
      const countdown = document.createElement("span");
      countdown.className = "countdown";
      countdown.dataset.eventCountdown = event.id;
      countdown.textContent = formatCountdown(event);
      button.append(copy, countdown);
      refs.upcomingList.append(button);
    }
  }

  function renderNotes() {
    const plan = state.dayPlans[selectedDateKey];
    if (document.activeElement !== refs.dayNotes) refs.dayNotes.value = plan?.note || "";
  }

  function handleTaskListClick(event) {
    const actionButton = event.target.closest("[data-action]");
    const card = event.target.closest("[data-task-id]");
    if (!actionButton || !card) return;
    const taskId = card.dataset.taskId;
    const action = actionButton.dataset.action;
    if (action === "toggle") toggleTask(taskId);
    if (action === "edit") openTaskDialog(taskId);
    if (action === "move-up") moveTask(taskId, -1);
    if (action === "move-down") moveTask(taskId, 1);
    if (action === "timer") toggleTaskTimer(taskId);
    if (action === "log") openFinishTaskDialog(selectedDateKey, taskId, { manual: true });
    if (action === "copy-code") copyText(actionButton.dataset.code, "Código de mapa copiado");
    if (action === "open-link") window.open(actionButton.dataset.link, "_blank", "noopener,noreferrer");
  }

  function toggleTask(taskId) {
    const before = getDayStats(selectedDateKey);
    materializeDay(selectedDateKey, "progress");
    state.progress[selectedDateKey] ||= {};
    if (state.activeTimer?.dateKey === selectedDateKey && state.activeTimer?.taskId === taskId) commitActiveTimer();
    const current = ensureProgressEntry(selectedDateKey, taskId);
    const nextDone = !current?.done;
    current.done = nextDone;
    current.completedAt = nextDone ? new Date().toISOString() : null;
    persist();
    render();
    const after = getDayStats(selectedDateKey);
    if (before.completed < before.total && after.total > 0 && after.completed === after.total) {
      celebrate();
      showToast("¡Rutina completada! Buen trabajo ⚡", "Revisar", openReviewDialog);
    }
  }

  function moveTask(taskId, direction) {
    const plan = materializeDay(selectedDateKey, "custom");
    const index = plan.tasks.findIndex((task) => task.id === taskId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= plan.tasks.length) return;
    [plan.tasks[index], plan.tasks[target]] = [plan.tasks[target], plan.tasks[index]];
    plan.updatedAt = new Date().toISOString();
    persist();
    render();
  }

  function openTaskDialog(taskId = "") {
    if (taskId && state.activeTimer?.dateKey === selectedDateKey && state.activeTimer?.taskId === taskId) {
      commitActiveTimer({ keepActive: true });
      persist({ quiet: true });
    }
    clearTaskErrors();
    refs.taskForm.reset();
    refs.taskId.value = taskId;
    refs.taskDuration.value = "20";
    refs.taskAdvancedDetails.open = false;
    const date = dateFromKey(selectedDateKey);
    const weekdayName = DAY_NAMES[date.getDay()];
    refs.dayScopeDescription.textContent = `El cambio solo afectará el ${date.getDate()} de ${date.toLocaleDateString("es-MX", { month: "long" })}.`;
    refs.templateScopeTitle.textContent = `Rutina de todos los ${DAY_PLURALS[date.getDay()]}`;
    refs.templateScopeOption.hidden = false;
    refs.templateScopeOption.querySelector("input").disabled = false;
    refs.taskForm.querySelector('input[name="taskScope"][value="day"]').checked = true;

    if (taskId) {
      const task = getEffectiveTasks(selectedDateKey).find((item) => item.id === taskId);
      if (!task) return;
      refs.taskDialogTitle.textContent = "Editar tarea";
      refs.taskTitle.value = task.title;
      refs.taskCategory.value = task.category;
      refs.taskDuration.value = String(task.duration);
      refs.taskNotes.value = task.notes || "";
      refs.taskGoal.value = task.goal || "";
      refs.taskRounds.value = task.rounds || "";
      refs.taskMapCode.value = task.mapCode || "";
      refs.taskLink.value = task.link || "";
      refs.taskAdvancedDetails.open = Boolean(task.goal || task.rounds || task.mapCode || task.link);
      refs.deleteTaskButton.hidden = false;
      const templateHasTask = getTemplateForDate(selectedDateKey).tasks.some((item) => item.id === taskId);
      if (!templateHasTask) {
        refs.templateScopeOption.querySelector("input").disabled = true;
        refs.templateScopeOption.title = "Esta tarea solo existe en la rutina personalizada";
      } else {
        refs.templateScopeOption.title = "";
      }
    } else {
      refs.taskDialogTitle.textContent = "Nueva tarea";
      refs.deleteTaskButton.hidden = true;
    }

    showModal(refs.taskDialog);
    window.setTimeout(() => refs.taskTitle.focus(), 50);
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    if (!validateTaskForm()) return;
    const taskId = refs.taskId.value;
    const scope = refs.taskForm.querySelector('input[name="taskScope"]:checked')?.value || "day";
    const taskData = {
      title: refs.taskTitle.value.trim(),
      category: refs.taskCategory.value,
      duration: clamp(Number(refs.taskDuration.value), 1, 600),
      notes: refs.taskNotes.value.trim(),
      goal: refs.taskGoal.value.trim(),
      rounds: nullableInt(refs.taskRounds.value, 1),
      mapCode: refs.taskMapCode.value.trim(),
      link: sanitizeUrl(refs.taskLink.value),
    };

    if (taskId) {
      updateTask(taskId, taskData, scope);
      showToast("Tarea actualizada");
    } else {
      addTask(taskData, scope);
      showToast(scope === "template" ? "Tarea añadida a tu rutina semanal" : "Tarea añadida para este día");
    }

    refs.taskDialog.close();
    persist();
    render();
  }

  function validateTaskForm() {
    clearTaskErrors();
    let valid = true;
    if (!refs.taskTitle.value.trim()) {
      refs.taskTitle.classList.add("invalid");
      refs.taskTitle.setAttribute("aria-invalid", "true");
      refs.taskTitleError.textContent = "Ponle un nombre a la tarea.";
      valid = false;
    }
    const duration = Number(refs.taskDuration.value);
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
      refs.taskDuration.classList.add("invalid");
      refs.taskDuration.setAttribute("aria-invalid", "true");
      refs.taskDurationError.textContent = "Usa una duración entre 1 y 600 minutos.";
      valid = false;
    }
    if (refs.taskLink.value.trim() && !sanitizeUrl(refs.taskLink.value)) {
      refs.taskLink.classList.add("invalid");
      refs.taskLink.setAttribute("aria-invalid", "true");
      refs.taskLinkError.textContent = "Usa un enlace que empiece con http:// o https://.";
      refs.taskAdvancedDetails.open = true;
      valid = false;
    }
    if (!valid) refs.taskForm.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  }

  function clearTaskErrors() {
    refs.taskTitle.classList.remove("invalid");
    refs.taskDuration.classList.remove("invalid");
    refs.taskLink.classList.remove("invalid");
    refs.taskTitle.removeAttribute("aria-invalid");
    refs.taskDuration.removeAttribute("aria-invalid");
    refs.taskLink.removeAttribute("aria-invalid");
    refs.taskTitleError.textContent = "";
    refs.taskDurationError.textContent = "";
    refs.taskLinkError.textContent = "";
  }

  function addTask(data, scope) {
    const task = normalizeTask({ id: makeId("tsk"), ...data });
    if (scope === "template") {
      const template = getTemplateForDate(selectedDateKey);
      template.tasks.push(task);
      touchTemplate(template);
      if (state.dayPlans[selectedDateKey]) {
        state.dayPlans[selectedDateKey].tasks.push(clone(task));
        state.dayPlans[selectedDateKey].updatedAt = new Date().toISOString();
      }
    } else {
      materializeDay(selectedDateKey, "custom").tasks.push(task);
    }
  }

  function updateTask(taskId, data, scope) {
    if (scope === "template") {
      const template = getTemplateForDate(selectedDateKey);
      const templateTask = template.tasks.find((task) => task.id === taskId);
      if (templateTask) Object.assign(templateTask, data);
      touchTemplate(template);
      const planTask = state.dayPlans[selectedDateKey]?.tasks.find((task) => task.id === taskId);
      if (planTask) Object.assign(planTask, data);
    } else {
      const plan = materializeDay(selectedDateKey, "custom");
      const task = plan.tasks.find((item) => item.id === taskId);
      if (task) Object.assign(task, data);
      plan.updatedAt = new Date().toISOString();
    }
    const progress = state.progress[selectedDateKey]?.[taskId];
    if (progress) progress.taskSnapshot = makeTaskSnapshot({ id: taskId, ...data });
  }

  async function handleTaskDelete() {
    const taskId = refs.taskId.value;
    if (!taskId) return;
    const scope = refs.taskForm.querySelector('input[name="taskScope"]:checked')?.value || "day";
    const task = getEffectiveTasks(selectedDateKey).find((item) => item.id === taskId);
    if (!task) return;
    if (state.activeTimer?.dateKey === selectedDateKey && state.activeTimer?.taskId === taskId) commitActiveTimer();

    refs.taskDialog.close();
    const snapshot = clone(state);
    if (scope === "template") {
      const template = getTemplateForDate(selectedDateKey);
      template.tasks = template.tasks.filter((item) => item.id !== taskId);
      touchTemplate(template);
      if (state.dayPlans[selectedDateKey]) {
        state.dayPlans[selectedDateKey].tasks = state.dayPlans[selectedDateKey].tasks.filter((item) => item.id !== taskId);
      }
    } else {
      const plan = materializeDay(selectedDateKey, "custom");
      plan.tasks = plan.tasks.filter((item) => item.id !== taskId);
    }
    if (state.progress[selectedDateKey]?.[taskId]) state.progress[selectedDateKey][taskId].archivedAt = new Date().toISOString();
    persist();
    render();
    showToast(`“${task.title}” eliminada`, "Deshacer", () => {
      state = snapshot;
      persist();
      render();
      showToast("Tarea recuperada");
    });
  }

  async function saveCurrentAsTemplate() {
    if (refs.routineToolsDialog.open) refs.routineToolsDialog.close();
    const date = dateFromKey(selectedDateKey);
    const isTournamentRoutine = Boolean(state.dayPlans[selectedDateKey]?.backupTasks);
    const accepted = await askConfirm({
      title: `Guardar para todos los ${DAY_PLURALS[date.getDay()]}`,
      message: isTournamentRoutine
        ? "Esta es una rutina de torneo. Se convertirá en la nueva rutina base de este día de la semana para fechas futuras."
        : "Las tareas actuales serán la rutina base para las fechas futuras que todavía no hayas personalizado.",
      acceptLabel: "Guardar rutina",
      dangerous: false,
    });
    if (!accepted) return;

    const template = getTemplateForDate(selectedDateKey);
    template.tasks = getEffectiveTasks(selectedDateKey).map((task) => {
      const copy = clone(task);
      delete copy.sourceTournamentId;
      return copy;
    });
    touchTemplate(template);
    persist();
    render();
    showToast(`Nueva rutina de ${DAY_NAMES[date.getDay()]} guardada`);
  }

  async function restoreTemplateForDay() {
    if (refs.routineToolsDialog.open) refs.routineToolsDialog.close();
    const accepted = await askConfirm({
      title: "Recuperar rutina base",
      message: "Reemplazaremos las tareas de esta fecha por la rutina semanal actual. Las notas del día y los torneos se conservarán.",
      acceptLabel: "Recuperar",
      dangerous: false,
    });
    if (!accepted) return;

    commitTimerForDate(selectedDateKey);
    const previousPlan = state.dayPlans[selectedDateKey] ? clone(state.dayPlans[selectedDateKey]) : null;
    const plan = materializeDay(selectedDateKey, "custom");
    plan.tasks = clone(getTemplateForDate(selectedDateKey).tasks);
    plan.reason = "custom";
    plan.backupTasks = null;
    plan.backupProgress = null;
    delete plan.tournamentPresetEventId;
    persist();
    render();
    showToast("Rutina base recuperada", "Deshacer", () => {
      commitTimerForDate(selectedDateKey);
      if (previousPlan) state.dayPlans[selectedDateKey] = previousPlan;
      else delete state.dayPlans[selectedDateKey];
      persist();
      render();
    });
  }

  async function restoreRoutineBackup() {
    const plan = state.dayPlans[selectedDateKey];
    if (!plan?.backupTasks) return;
    const accepted = await askConfirm({
      title: "Volver a la rutina normal",
      message: "Quitaremos el calentamiento de torneo y recuperaremos la rutina que tenías antes. El evento seguirá en el calendario.",
      acceptLabel: "Restaurar rutina",
      dangerous: false,
    });
    if (!accepted) return;

    commitTimerForDate(selectedDateKey);
    const tournamentTasks = clone(plan.tasks);
    const presetEventId = plan.tournamentPresetEventId;
    plan.tasks = clone(plan.backupTasks);
    plan.backupTasks = null;
    plan.backupProgress = null;
    plan.reason = "custom";
    delete plan.tournamentPresetEventId;
    persist();
    render();
    showToast("Rutina normal recuperada", "Deshacer", () => {
      commitTimerForDate(selectedDateKey);
      plan.backupTasks = clone(plan.tasks);
      plan.backupProgress = {};
      plan.tasks = tournamentTasks;
      plan.reason = "tournament";
      if (presetEventId) plan.tournamentPresetEventId = presetEventId;
      persist();
      render();
    });
  }

  function openEventDialog(eventId = "") {
    clearEventErrors();
    refs.eventForm.reset();
    refs.eventId.value = eventId;
    refs.eventDate.value = selectedDateKey;
    refs.eventTime.value = "18:00";
    refs.eventRegion.value = state.profile.region || "NA-Central";
    refs.adaptOption.hidden = false;
    refs.adaptRoutine.disabled = false;
    refs.adaptRoutine.checked = false;

    if (eventId) {
      const tournament = state.tournaments[eventId];
      if (!tournament) return;
      refs.eventDialogTitle.textContent = "Editar torneo";
      refs.eventName.value = tournament.name;
      refs.eventDate.value = tournament.date;
      refs.eventTime.value = tournament.startTime;
      refs.eventCheckIn.value = tournament.checkInTime || "";
      refs.eventFormat.value = tournament.format;
      refs.eventRegion.value = tournament.region || state.profile.region || "NA-Central";
      refs.eventTeammate.value = tournament.teammate || "";
      refs.eventRulesLink.value = tournament.rulesUrl || "";
      refs.eventNotes.value = tournament.notes || "";
      refs.eventCheckSetup.checked = Boolean(tournament.checklist?.setup);
      refs.eventCheckWater.checked = Boolean(tournament.checklist?.water);
      refs.eventCheckDiscord.checked = Boolean(tournament.checklist?.discord);
      refs.eventCheckRules.checked = Boolean(tournament.checklist?.rules);
      refs.eventMatches.value = tournament.result?.matches ?? "";
      refs.eventPoints.value = tournament.result?.points ?? "";
      refs.eventElims.value = tournament.result?.eliminations ?? "";
      refs.eventPlacement.value = tournament.result?.placement ?? "";
      refs.deleteEventButton.hidden = false;
      refs.exportEventButton.hidden = false;
      const alreadyAdapted = state.dayPlans[tournament.date]?.tournamentPresetEventId === tournament.id;
      if (alreadyAdapted) {
        refs.adaptRoutine.checked = true;
        refs.adaptRoutine.disabled = true;
        refs.adaptOption.title = "La rutina de torneo ya está aplicada";
      } else {
        refs.adaptOption.title = "";
      }
    } else {
      refs.eventDialogTitle.textContent = "Nuevo torneo";
      refs.deleteEventButton.hidden = true;
      refs.exportEventButton.hidden = true;
    }

    showModal(refs.eventDialog);
    window.setTimeout(() => refs.eventName.focus(), 50);
  }

  function handleEventSubmit(event) {
    event.preventDefault();
    if (!validateEventForm()) return;
    const existingId = refs.eventId.value;
    const id = existingId || makeId("trn");
    const previous = existingId ? state.tournaments[existingId] : null;
    const newDate = refs.eventDate.value;
    const wasAdapted = previous && state.dayPlans[previous.date]?.tournamentPresetEventId === id;
    const tournament = {
      id,
      name: refs.eventName.value.trim(),
      date: newDate,
      startTime: refs.eventTime.value,
      checkInTime: refs.eventCheckIn.value,
      format: refs.eventFormat.value,
      region: refs.eventRegion.value,
      teammate: refs.eventTeammate.value.trim(),
      rulesUrl: sanitizeUrl(refs.eventRulesLink.value),
      notes: refs.eventNotes.value.trim(),
      status: [refs.eventMatches.value, refs.eventPoints.value, refs.eventElims.value, refs.eventPlacement.value].some((value) => value !== "") ? "completed" : "scheduled",
      checklist: { setup: refs.eventCheckSetup.checked, water: refs.eventCheckWater.checked, discord: refs.eventCheckDiscord.checked, rules: refs.eventCheckRules.checked },
      result: { matches: nullableInt(refs.eventMatches.value), points: nullableInt(refs.eventPoints.value), eliminations: nullableInt(refs.eventElims.value), placement: nullableInt(refs.eventPlacement.value, 1) },
      createdAt: previous?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.tournaments[id] = tournament;
    if (wasAdapted && previous.date !== newDate) {
      commitTimerForDate(previous.date);
      const oldPlan = state.dayPlans[previous.date];
      if (oldPlan?.backupTasks) oldPlan.tasks = clone(oldPlan.backupTasks);
      if (oldPlan) {
        oldPlan.backupTasks = null;
        oldPlan.backupProgress = null;
        oldPlan.reason = "custom";
        delete oldPlan.tournamentPresetEventId;
      }
      applyTournamentPreset(tournament);
    }
    syncTournamentTask(tournament);

    if (refs.adaptRoutine.checked && !refs.adaptRoutine.disabled && !wasAdapted) {
      applyTournamentPreset(tournament);
    }

    refs.eventDialog.close();
    selectedDateKey = tournament.date;
    visibleWeekStart = startOfWeek(dateFromKey(tournament.date));
    persist();
    render();
    showToast(existingId ? "Torneo actualizado" : "Torneo añadido al calendario");
  }

  function validateEventForm() {
    clearEventErrors();
    let valid = true;
    if (!refs.eventName.value.trim()) {
      refs.eventName.classList.add("invalid");
      refs.eventName.setAttribute("aria-invalid", "true");
      refs.eventNameError.textContent = "Escribe el nombre del torneo.";
      valid = false;
    }
    if (!isDateKey(refs.eventDate.value)) {
      refs.eventDate.classList.add("invalid");
      refs.eventDate.setAttribute("aria-invalid", "true");
      refs.eventDateError.textContent = "Elige una fecha válida.";
      valid = false;
    }
    if (!refs.eventTime.value) {
      refs.eventTime.classList.add("invalid");
      refs.eventTime.setAttribute("aria-invalid", "true");
      refs.eventTimeError.textContent = "Elige una hora de inicio.";
      valid = false;
    }
    if (refs.eventRulesLink.value.trim() && !sanitizeUrl(refs.eventRulesLink.value)) {
      refs.eventRulesLink.classList.add("invalid");
      refs.eventRulesLink.setAttribute("aria-invalid", "true");
      refs.eventRulesError.textContent = "Usa un enlace http:// o https://.";
      valid = false;
    }
    if (!valid) refs.eventForm.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  }

  function clearEventErrors() {
    refs.eventName.classList.remove("invalid");
    refs.eventTime.classList.remove("invalid");
    refs.eventDate.classList.remove("invalid");
    refs.eventRulesLink.classList.remove("invalid");
    refs.eventName.removeAttribute("aria-invalid");
    refs.eventTime.removeAttribute("aria-invalid");
    refs.eventDate.removeAttribute("aria-invalid");
    refs.eventRulesLink.removeAttribute("aria-invalid");
    refs.eventNameError.textContent = "";
    refs.eventTimeError.textContent = "";
    refs.eventDateError.textContent = "";
    refs.eventRulesError.textContent = "";
  }

  function applyTournamentPreset(tournament) {
    commitTimerForDate(tournament.date);
    const currentTasks = clone(getEffectiveTasks(tournament.date));
    const plan = materializeDay(tournament.date, "tournament");
    if (!plan.backupTasks) {
      plan.backupTasks = currentTasks;
      plan.backupProgress = clone(state.progress[tournament.date] || {});
    }
    plan.reason = "tournament";
    plan.tournamentPresetEventId = tournament.id;
    const shortWarmup = state.profile.dailyMinutes <= 60;
    plan.tasks = [
      createTask("Revisar setup y conexión", "other", 10, "Cierra descargas, revisa región y periféricos", tournament.id),
      createTask("Aim suave", "aim", shortWarmup ? 10 : 15, "Activa la mano sin buscar récords", tournament.id),
      createTask("Edits + piece control", "edit", shortWarmup ? 10 : 15, "Combos simples, precisos y útiles", tournament.id),
      createTask("Agua y reset mental", "break", 10, "Respira, levántate y prepara el enfoque", tournament.id),
      { ...createTask(tournament.name, "ranked", 180, `${tournament.format} · ${tournament.region} · inicio ${tournament.startTime}`, tournament.id), goal: "Mantener decisiones claras durante toda la sesión" },
    ];
  }

  function syncTournamentTask(tournament) {
    const plan = state.dayPlans[tournament.date];
    if (!plan) return;
    const task = plan.tasks.find((item) => item.sourceTournamentId === tournament.id && item.category === "ranked");
    if (task) {
      task.title = tournament.name;
      task.notes = `${tournament.format} · ${tournament.region} · inicio ${tournament.startTime}`;
    }
  }

  async function handleEventDelete() {
    const eventId = refs.eventId.value;
    const tournament = state.tournaments[eventId];
    if (!tournament) return;
    refs.eventDialog.close();
    const hasGeneratedRoutine = state.dayPlans[tournament.date]?.tournamentPresetEventId === eventId;
    const accepted = await askConfirm({
      title: "Eliminar torneo",
      message: hasGeneratedRoutine
        ? "Quitaremos el evento del calendario. La rutina adaptada se conservará para no borrar tus cambios; podrás restaurarla desde el panel del día."
        : "El evento se quitará del calendario. Tu rutina del día no cambiará.",
      acceptLabel: "Eliminar torneo",
      dangerous: true,
    });
    if (!accepted) return;

    const snapshot = clone(tournament);
    delete state.tournaments[eventId];
    persist();
    render();
    showToast(`“${tournament.name}” eliminado`, "Deshacer", () => {
      state.tournaments[eventId] = snapshot;
      persist();
      render();
    });
  }

  function renderNotesOnly() {
    renderWeek();
    renderRoutine();
    renderSummary();
  }

  function handleNotesInput() {
    const plan = materializeDay(selectedDateKey, "custom");
    plan.note = refs.dayNotes.value.slice(0, 500);
    plan.updatedAt = new Date().toISOString();
    setSavingState(true);
    clearTimeout(noteSaveTimer);
    noteSaveTimer = window.setTimeout(() => {
      noteSaveTimer = null;
      persist();
      renderNotesOnly();
    }, 450);
  }

  function flushNotesSave() {
    if (!noteSaveTimer) return;
    clearTimeout(noteSaveTimer);
    noteSaveTimer = null;
    persist();
    renderNotesOnly();
  }

  function getEffectiveTasks(dateKey) {
    const plan = state.dayPlans[dateKey];
    return plan ? plan.tasks : getTemplateForDate(dateKey).tasks;
  }

  function getTemplateForDate(dateKey) {
    return state.templates[isoWeekday(dateFromKey(dateKey))];
  }

  function materializeDay(dateKey, reason = "custom") {
    if (state.dayPlans[dateKey]) {
      if (reason === "tournament") state.dayPlans[dateKey].reason = reason;
      return state.dayPlans[dateKey];
    }
    const template = getTemplateForDate(dateKey);
    const now = new Date().toISOString();
    state.dayPlans[dateKey] = {
      reason,
      base: { weekday: isoWeekday(dateFromKey(dateKey)), templateRevision: template.revision },
      tasks: clone(template.tasks),
      note: "",
      backupTasks: null,
      backupProgress: null,
      createdAt: now,
      updatedAt: now,
    };
    return state.dayPlans[dateKey];
  }

  function getDayStats(dateKey) {
    const tasks = getEffectiveTasks(dateKey);
    const progress = state.progress[dateKey] || {};
    let completed = 0;
    let totalMinutes = 0;
    let remainingMinutes = 0;
    for (const task of tasks) {
      totalMinutes += task.duration;
      if (progress[task.id]?.done && !progress[task.id]?.archivedAt) completed += 1;
      else remainingMinutes += task.duration;
    }
    const actualSeconds = Object.keys(progress).reduce((sum, taskId) => sum + getActualSeconds(dateKey, taskId), 0);
    return {
      total: tasks.length,
      completed,
      totalMinutes,
      remainingMinutes,
      actualSeconds,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }

  function getEventsForDate(dateKey) {
    return Object.values(state.tournaments)
      .filter((event) => event.date === dateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function getUpcomingEvents() {
    const threshold = Date.now() - 4 * 60 * 60 * 1000;
    return Object.values(state.tournaments)
      .filter((event) => event.status === "scheduled" && eventDateTime(event).getTime() >= threshold)
      .sort((a, b) => eventDateTime(a) - eventDateTime(b));
  }

  function eventDateTime(event, useCheckIn = false) {
    const date = dateFromKey(event.date);
    const [hours, minutes] = (useCheckIn && event.checkInTime ? event.checkInTime : event.startTime || "18:00").split(":").map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  }

  function formatCountdown(event) {
    const difference = eventDateTime(event).getTime() - Date.now();
    if (difference <= 0) return difference > -14400000 ? "En curso" : "Finalizado";
    const totalMinutes = Math.ceil(difference / 60000);
    if (totalMinutes < 60) return `en ${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    if (hours < 24) return `en ${hours} h`;
    const days = Math.floor(hours / 24);
    return `en ${days} ${days === 1 ? "día" : "días"}`;
  }

  function createTask(title, category, duration, notes = "", sourceTournamentId = "") {
    return {
      id: makeId("tsk"), title, category, duration, notes, goal: "", rounds: null, mapCode: "", link: "",
      ...(sourceTournamentId ? { sourceTournamentId } : {}),
    };
  }

  function ensureProgressEntry(dateKey, taskId) {
    state.progress[dateKey] ||= {};
    const task = getEffectiveTasks(dateKey).find((item) => item.id === taskId);
    const existing = state.progress[dateKey][taskId];
    if (existing) {
      existing.archivedAt = null;
      if (!existing.taskSnapshot && task) existing.taskSnapshot = makeTaskSnapshot(task);
      return existing;
    }
    state.progress[dateKey][taskId] = {
      done: false, completedAt: null, actualSeconds: 0, hasTimingData: false,
      firstStartedAt: null, lastStoppedAt: null, roundsCompleted: 0, sessionRating: "", correctedAt: null, archivedAt: null,
      taskSnapshot: makeTaskSnapshot(task),
    };
    return state.progress[dateKey][taskId];
  }

  function getActualSeconds(dateKey, taskId) {
    const base = Number(state.progress[dateKey]?.[taskId]?.actualSeconds) || 0;
    if (state.activeTimer?.dateKey !== dateKey || state.activeTimer?.taskId !== taskId || state.activeTimer.status !== "running") return base;
    const delta = Math.max(0, Math.min(43200, (Date.now() - state.activeTimer.startedAt) / 1000));
    return base + delta;
  }

  function toggleTaskTimer(taskId) {
    if (activeView === "plan") {
      showToast("Abre Hoy para iniciar un entrenamiento");
      return;
    }
    if (state.activeTimer?.dateKey === selectedDateKey && state.activeTimer?.taskId === taskId) {
      if (state.activeTimer.status === "running") toggleActiveTimer();
      else {
        resumeActiveTimer();
        openFocusMode();
      }
      return;
    }
    if (state.activeTimer) commitActiveTimer();
    materializeDay(selectedDateKey, "progress");
    const entry = ensureProgressEntry(selectedDateKey, taskId);
    entry.firstStartedAt ||= new Date().toISOString();
    state.activeTimer = { dateKey: selectedDateKey, taskId, status: "running", startedAt: Date.now() };
    persist();
    render();
    updateTimerDisplay();
    openFocusMode();
  }

  function commitActiveTimer({ keepActive = false } = {}) {
    if (!state.activeTimer) return null;
    const { dateKey, taskId, startedAt, status } = state.activeTimer;
    const entry = ensureProgressEntry(dateKey, taskId);
    if (status === "running" && Number.isFinite(startedAt)) {
      const delta = Math.max(0, Math.min(43200, Math.floor((Date.now() - startedAt) / 1000)));
      entry.actualSeconds = clamp((Number(entry.actualSeconds) || 0) + delta, 0, 43200);
    }
    entry.hasTimingData = true;
    entry.lastStoppedAt = new Date().toISOString();
    state.activeTimer = keepActive ? { dateKey, taskId, status: "paused", startedAt: null } : null;
    return { dateKey, taskId, entry };
  }

  function commitTimerForDate(dateKey) {
    if (state.activeTimer?.dateKey !== dateKey) return null;
    return commitActiveTimer();
  }

  function toggleActiveTimer() {
    if (!state.activeTimer) return;
    if (state.activeTimer.status === "running") {
      commitActiveTimer({ keepActive: true });
      persist();
      render();
      showToast("Temporizador pausado");
    } else {
      resumeActiveTimer();
    }
  }

  function resumeActiveTimer() {
    if (!state.activeTimer) return;
    const entry = ensureProgressEntry(state.activeTimer.dateKey, state.activeTimer.taskId);
    entry.firstStartedAt ||= new Date().toISOString();
    state.activeTimer.status = "running";
    state.activeTimer.startedAt = Date.now();
    persist();
    render();
    updateTimerDisplay();
  }

  function finishActiveTimer() {
    if (!state.activeTimer) return;
    const { dateKey, taskId } = state.activeTimer;
    commitActiveTimer({ keepActive: true });
    persist({ quiet: true });
    openFinishTaskDialog(dateKey, taskId, { manual: false });
  }

  function renderTimerBar() {
    const timer = state.activeTimer;
    if (!timer) {
      refs.timerBar.hidden = true;
      document.body.classList.remove("timer-active");
      return;
    }
    const task = getEffectiveTasks(timer.dateKey).find((item) => item.id === timer.taskId);
    if (!task) {
      state.activeTimer = null;
      persist({ quiet: true });
      refs.timerBar.hidden = true;
      document.body.classList.remove("timer-active");
      minimizeFocusMode();
      return;
    }
    refs.timerBar.hidden = false;
    const running = timer.status === "running";
    refs.timerBar.classList.toggle("running", running);
    refs.timerBar.classList.toggle("paused", !running);
    refs.activeTimerTask.textContent = task.title;
    refs.activeTimerGoal.textContent = task.goal || CATEGORIES[task.category]?.label || "Entrenamiento";
    refs.activeTimerPlanned.textContent = `de ${formatTimer(task.duration * 60)}`;
    setControlButtonState(refs.timerPauseButton, running, false);
    document.body.classList.add("timer-active");
    updateTimerDisplay();
    if (refs.focusDialog.open) renderFocusMode();
  }

  function updateTimerDisplay() {
    if (!state?.activeTimer || refs.timerBar.hidden) return;
    const task = getEffectiveTasks(state.activeTimer.dateKey).find((item) => item.id === state.activeTimer.taskId);
    if (!task) return;
    const seconds = getActualSeconds(state.activeTimer.dateKey, state.activeTimer.taskId);
    refs.activeTimerElapsed.textContent = formatTimer(seconds);
    refs.timerProgress.style.width = `${Math.min(100, (seconds / (task.duration * 60)) * 100)}%`;
    refs.timerBar.classList.toggle("overtime", seconds >= task.duration * 60);
    if (refs.focusDialog.open) updateFocusTimerDisplay(task, seconds);
  }

  function setControlButtonState(button, running, includeText = true) {
    const use = button.querySelector("use");
    if (use) use.setAttribute("href", running ? "#icon-pause" : "#icon-play");
    button.setAttribute("aria-label", running ? "Pausar temporizador" : "Reanudar temporizador");
    if (includeText) {
      const text = button.querySelector("span");
      if (text) text.textContent = running ? "Pausar" : "Reanudar";
    }
  }

  function openFocusMode() {
    if (!state.activeTimer) return;
    renderFocusMode();
    if (!refs.focusDialog.open) showModal(refs.focusDialog);
  }

  function minimizeFocusMode() {
    if (refs.focusDialog.open) refs.focusDialog.close();
  }

  function getActiveTimerTask() {
    if (!state.activeTimer) return null;
    return getEffectiveTasks(state.activeTimer.dateKey).find((task) => task.id === state.activeTimer.taskId) || null;
  }

  function renderFocusMode() {
    const task = getActiveTimerTask();
    if (!task || !state.activeTimer) {
      minimizeFocusMode();
      return;
    }
    const category = CATEGORIES[task.category] || CATEGORIES.other;
    const entry = ensureProgressEntry(state.activeTimer.dateKey, state.activeTimer.taskId);
    refs.focusCategory.textContent = category.label;
    refs.focusCategory.style.setProperty("--task-color", category.color);
    refs.focusTaskTitle.textContent = task.title;
    refs.focusPlanned.textContent = `de ${formatTimer(task.duration * 60)} planeados`;
    refs.focusGoal.hidden = !task.goal;
    refs.focusGoal.textContent = task.goal || "";
    refs.focusMapBlock.hidden = !task.mapCode;
    refs.focusMapCode.textContent = task.mapCode || "";
    refs.focusRoundsBlock.hidden = !(task.rounds > 0);
    refs.focusRoundsValue.textContent = task.rounds > 0 ? `${entry.roundsCompleted || 0} / ${task.rounds}` : "";
    refs.focusRoundsMinus.disabled = !(entry.roundsCompleted > 0);
    refs.focusRoundsPlus.disabled = (entry.roundsCompleted || 0) >= 9999;
    refs.focusOpenLinkButton.hidden = !task.link;
    refs.focusNotes.hidden = !task.notes;
    refs.focusNotes.textContent = task.notes || "";
    setControlButtonState(refs.focusPauseButton, state.activeTimer.status === "running", true);
    updateFocusTimerDisplay(task, getActualSeconds(state.activeTimer.dateKey, state.activeTimer.taskId));
  }

  function updateFocusTimerDisplay(task, seconds) {
    refs.focusElapsed.textContent = formatTimer(seconds);
    refs.focusProgress.style.width = `${Math.min(100, (seconds / Math.max(1, task.duration * 60)) * 100)}%`;
    refs.focusDialog.classList.toggle("overtime", seconds >= task.duration * 60);
  }

  function copyFocusMapCode() {
    const task = getActiveTimerTask();
    if (task?.mapCode) copyText(task.mapCode, "Código de mapa copiado");
  }

  function openFocusResource() {
    const task = getActiveTimerTask();
    if (task?.link) window.open(task.link, "_blank", "noopener,noreferrer");
  }

  function changeFocusRounds(change) {
    if (!state.activeTimer) return;
    const entry = ensureProgressEntry(state.activeTimer.dateKey, state.activeTimer.taskId);
    entry.roundsCompleted = clamp((Number(entry.roundsCompleted) || 0) + change, 0, 9999);
    persist({ quiet: true });
    renderFocusMode();
  }

  function addFiveMinutesToFocusedTask() {
    if (!state.activeTimer) return;
    const { dateKey, taskId } = state.activeTimer;
    const plan = materializeDay(dateKey, "custom");
    const task = plan.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.duration = clamp(task.duration + 5, 1, 600);
    plan.updatedAt = new Date().toISOString();
    const entry = ensureProgressEntry(dateKey, taskId);
    entry.taskSnapshot = makeTaskSnapshot(task);
    persist();
    render();
    showToast("Añadimos 5 minutos a esta tarea");
  }

  function openFinishTaskDialog(dateKey, taskId, { manual = false } = {}) {
    if (!isDateKey(dateKey) || !taskId) return;
    if (state.activeTimer?.status === "running") commitActiveTimer({ keepActive: true });
    const task = getEffectiveTasks(dateKey).find((item) => item.id === taskId);
    if (!task) return;
    const entry = ensureProgressEntry(dateKey, taskId);
    pendingFinish = { dateKey, taskId, manual };
    refs.finishTaskForm.reset();
    refs.finishTaskTitle.textContent = manual ? `Registrar ${task.title}` : `Finalizar ${task.title}`;
    refs.finishTaskSummary.textContent = `${formatTimer(entry.actualSeconds)} registrados · ${formatMinutes(task.duration)} planeados`;
    refs.finishActualMinutes.value = String(Math.round((entry.actualSeconds / 60) * 100) / 100);
    refs.finishRoundsField.hidden = !(task.rounds > 0);
    refs.finishRoundsCompleted.value = String(entry.roundsCompleted || 0);
    refs.finishRating.value = entry.sessionRating || "normal";
    refs.finishMarkDone.checked = entry.done || !manual;
    refs.finishTimeError.textContent = "";
    minimizeFocusMode();
    persist({ quiet: true });
    renderTimerBar();
    showModal(refs.finishTaskDialog);
  }

  function handleFinishTimeAdjust(event) {
    const button = event.target.closest("[data-time-adjust]");
    if (!button) return;
    const current = Number(refs.finishActualMinutes.value) || 0;
    refs.finishActualMinutes.value = String(clamp(Math.round((current + Number(button.dataset.timeAdjust)) * 100) / 100, 0, 720));
  }

  function handleFinishTaskSubmit(event) {
    event.preventDefault();
    if (!pendingFinish) return;
    const minutes = Number(refs.finishActualMinutes.value);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 720) {
      refs.finishTimeError.textContent = "Usa un tiempo entre 0 y 720 minutos.";
      refs.finishActualMinutes.focus();
      return;
    }
    const { dateKey, taskId } = pendingFinish;
    const entry = ensureProgressEntry(dateKey, taskId);
    const task = getEffectiveTasks(dateKey).find((item) => item.id === taskId);
    entry.actualSeconds = clamp(Math.round(minutes * 60), 0, 43200);
    entry.hasTimingData = true;
    entry.roundsCompleted = clamp(Number(refs.finishRoundsCompleted.value) || 0, 0, 9999);
    entry.sessionRating = ["normal", "excellent", "incomplete"].includes(refs.finishRating.value) ? refs.finishRating.value : "normal";
    entry.correctedAt = new Date().toISOString();
    entry.lastStoppedAt = entry.correctedAt;
    entry.done = refs.finishMarkDone.checked;
    entry.completedAt = entry.done ? entry.correctedAt : null;
    if (task) entry.taskSnapshot = makeTaskSnapshot(task);
    if (state.activeTimer?.dateKey === dateKey && state.activeTimer?.taskId === taskId) state.activeTimer = null;
    pendingFinish = null;
    refs.finishTaskDialog.close();
    persist();
    render();
    const stats = getDayStats(dateKey);
    if (entry.done && stats.total > 0 && stats.completed === stats.total) {
      celebrate();
      showToast("¡Sesión completada!", "Revisar", () => {
        selectedDateKey = dateKey;
        openReviewDialog();
      });
    } else {
      showToast(entry.done ? "Tarea finalizada y registro guardado" : "Tiempo guardado; la tarea sigue pendiente");
    }
  }

  function continueFinishedTask() {
    if (!pendingFinish) return;
    const { dateKey, taskId } = pendingFinish;
    if (state.activeTimer && (state.activeTimer.dateKey !== dateKey || state.activeTimer.taskId !== taskId)) commitActiveTimer();
    state.activeTimer = { dateKey, taskId, status: "running", startedAt: Date.now() };
    ensureProgressEntry(dateKey, taskId).firstStartedAt ||= new Date().toISOString();
    pendingFinish = null;
    refs.finishTaskDialog.close();
    persist();
    render();
    openFocusMode();
  }

  function startBackgroundLoops() {
    clearInterval(timerTicker);
    clearInterval(reminderTicker);
    timerTicker = window.setInterval(updateTimerDisplay, 1000);
    reminderTicker = window.setInterval(() => {
      updateCountdowns();
      checkReminders();
    }, 30000);
    checkReminders();
  }

  function updateCountdowns() {
    document.querySelectorAll("[data-event-countdown]").forEach((node) => {
      const event = state.tournaments[node.dataset.eventCountdown];
      if (event) node.textContent = formatCountdown(event);
    });
  }

  function touchTemplate(template) {
    template.revision = (Number(template.revision) || 0) + 1;
    template.updatedAt = new Date().toISOString();
  }

  function selectDate(dateKey) {
    flushNotesSave();
    selectedDateKey = dateKey;
    const date = dateFromKey(dateKey);
    const currentWeekKey = localDateKey(visibleWeekStart);
    const dateWeekKey = localDateKey(startOfWeek(date));
    if (currentWeekKey !== dateWeekKey) visibleWeekStart = startOfWeek(date);
    render();
    window.requestAnimationFrame(() => scrollSelectedDayIntoView(true));
  }

  function goToToday() {
    flushNotesSave();
    const today = new Date();
    activeView = "today";
    selectedDateKey = localDateKey(today);
    visibleWeekStart = startOfWeek(today);
    render();
    window.requestAnimationFrame(() => scrollSelectedDayIntoView(true));
  }

  function changeWeek(amount) {
    flushNotesSave();
    activeView = "plan";
    visibleWeekStart = addDays(visibleWeekStart, amount);
    selectedDateKey = localDateKey(addDays(dateFromKey(selectedDateKey), amount));
    render();
    window.requestAnimationFrame(() => scrollSelectedDayIntoView(true));
  }

  function scrollSelectedDayIntoView(smooth) {
    const button = refs.weekGrid.querySelector(`[data-date="${selectedDateKey}"]`);
    if (!button) return;
    const left = button.offsetLeft - (refs.weekGrid.clientWidth - button.offsetWidth) / 2;
    refs.weekGrid.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" });
  }

  function openReviewDialog() {
    refs.reviewForm.reset();
    refs.focusError.textContent = "";
    const review = state.reviews[selectedDateKey];
    const stats = getDayStats(selectedDateKey);
    refs.reviewDialogTitle.textContent = review ? "Revisión de la sesión" : "¿Cómo entrenaste hoy?";
    refs.reviewSummary.textContent = `${stats.completed} de ${stats.total} tareas · ${formatMinutes(Math.round(stats.actualSeconds / 60))} registrados`;
    if (review) {
      refs.reviewForm.querySelector(`input[name="focus"][value="${review.focus}"]`)?.click();
      refs.reviewFeeling.value = review.feeling;
      refs.reviewWin.value = review.wentWell;
      refs.reviewError.value = review.wentWrong;
      refs.reviewNext.value = review.nextFocus;
      refs.reviewErrorTags.querySelectorAll("input").forEach((input) => { input.checked = review.mistakes.includes(input.value); });
    }
    showModal(refs.reviewDialog);
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    const focus = Number(refs.reviewForm.querySelector('input[name="focus"]:checked')?.value || 0);
    if (!focus) {
      refs.focusError.textContent = "Elige un nivel de concentración del 1 al 5.";
      refs.focusRating.querySelector("input")?.focus();
      return;
    }
    const previous = state.reviews[selectedDateKey];
    state.reviews[selectedDateKey] = {
      date: selectedDateKey,
      focus,
      feeling: refs.reviewFeeling.value,
      wentWell: refs.reviewWin.value.trim(),
      wentWrong: refs.reviewError.value.trim(),
      nextFocus: refs.reviewNext.value.trim(),
      mistakes: Array.from(refs.reviewErrorTags.querySelectorAll("input:checked"), (input) => input.value),
      createdAt: previous?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    refs.reviewDialog.close();
    persist();
    render();
    showToast("Revisión guardada. Mañana entrenarás con más intención");
  }

  function renderHistory() {
    if (!refs.categoryChart) return;
    const rangeValue = refs.historyRange.value;
    const cutoff = rangeValue === "all" ? "0000-00-00" : localDateKey(addDays(new Date(), -(Number(rangeValue) - 1)));
    const dates = Array.from(new Set([
      ...Object.keys(state.progress), ...Object.keys(state.reviews), ...Object.keys(state.dayPlans),
    ])).filter((dateKey) => isDateKey(dateKey) && dateKey >= cutoff && dateKey <= localDateKey(new Date())).sort();

    let actualSeconds = 0;
    let plannedMinutes = 0;
    let completed = 0;
    let total = 0;
    let focusTotal = 0;
    let focusCount = 0;
    const categorySeconds = Object.fromEntries(Object.keys(CATEGORIES).map((key) => [key, 0]));
    const mistakes = {};
    const sessions = [];

    for (const dateKey of dates) {
      const data = getHistoryDayData(dateKey);
      actualSeconds += data.actualSeconds;
      plannedMinutes += data.plannedMinutes;
      completed += data.completed;
      total += data.total;
      for (const [category, seconds] of Object.entries(data.categorySeconds)) categorySeconds[category] = (categorySeconds[category] || 0) + seconds;
      const review = state.reviews[dateKey];
      if (review?.focus) { focusTotal += review.focus; focusCount += 1; }
      for (const mistake of review?.mistakes || []) mistakes[mistake] = (mistakes[mistake] || 0) + 1;
      if (data.actualSeconds > 0 || data.completed > 0 || review) sessions.push({ dateKey, data, review });
    }

    refs.historyActual.textContent = formatMinutes(Math.round(actualSeconds / 60));
    refs.historyActualHint.textContent = `${formatMinutes(plannedMinutes)} planeados`;
    refs.historyCompletion.textContent = `${total ? Math.round((completed / total) * 100) : 0}%`;
    refs.historyStreak.textContent = `${calculateStreak()} ${calculateStreak() === 1 ? "día" : "días"}`;
    refs.historyFocus.textContent = focusCount ? `${(focusTotal / focusCount).toFixed(1)} / 5` : "—";

    renderCategoryChart(categorySeconds);
    renderTrainingHeatmap();
    renderErrorSummary(mistakes);
    renderSessionList(sessions.reverse());
  }

  function getHistoryDayData(dateKey) {
    const progress = state.progress[dateKey] || {};
    const activeTasks = getEffectiveTasks(dateKey);
    const activeIds = new Set(activeTasks.map((task) => task.id));
    const snapshots = Object.values(progress).map((entry) => entry.taskSnapshot).filter(Boolean);
    const plannedMinutes = activeTasks.reduce((sum, task) => sum + task.duration, 0)
      || snapshots.reduce((sum, task) => sum + (task.plannedMinutes || 0), 0);
    let actualSeconds = 0;
    let completed = 0;
    let roundsCompleted = 0;
    const categorySeconds = {};
    const ratings = { excellent: 0, normal: 0, incomplete: 0 };
    for (const [taskId, entry] of Object.entries(progress)) {
      const seconds = taskId === state.activeTimer?.taskId && dateKey === state.activeTimer?.dateKey
        ? getActualSeconds(dateKey, taskId)
        : Number(entry.actualSeconds) || 0;
      actualSeconds += seconds;
      roundsCompleted += Number(entry.roundsCompleted) || 0;
      if (ratings[entry.sessionRating] !== undefined) ratings[entry.sessionRating] += 1;
      if (entry.done && !entry.archivedAt && activeIds.has(taskId)) completed += 1;
      const category = entry.taskSnapshot?.category || activeTasks.find((task) => task.id === taskId)?.category || "other";
      categorySeconds[category] = (categorySeconds[category] || 0) + seconds;
    }
    return { actualSeconds, plannedMinutes, completed, total: activeTasks.length, categorySeconds, roundsCompleted, ratings };
  }

  function renderCategoryChart(categorySeconds) {
    refs.categoryChart.replaceChildren();
    const entries = Object.entries(categorySeconds).filter(([, seconds]) => seconds > 0).sort((a, b) => b[1] - a[1]);
    const maximum = Math.max(...entries.map(([, seconds]) => seconds), 1);
    if (!entries.length) {
      refs.categoryChart.append(makeEmptyAnalytics("Inicia un temporizador para ver tu distribución real."));
      return;
    }
    for (const [key, seconds] of entries) {
      const row = document.createElement("div");
      row.className = "category-row";
      row.style.setProperty("--category-color", CATEGORIES[key]?.color || CATEGORIES.other.color);
      const label = document.createElement("span");
      label.textContent = CATEGORIES[key]?.label || key;
      const bar = document.createElement("span");
      bar.className = "category-bar";
      const fill = document.createElement("span");
      fill.className = "category-fill";
      fill.style.width = `${(seconds / maximum) * 100}%`;
      bar.append(fill);
      const value = document.createElement("strong");
      value.textContent = seconds < 60 ? "<1 min" : formatMinutes(Math.round(seconds / 60));
      row.append(label, bar, value);
      refs.categoryChart.append(row);
    }
  }

  function renderTrainingHeatmap() {
    refs.trainingHeatmap.replaceChildren();
    for (let offset = 20; offset >= 0; offset -= 1) {
      const date = addDays(new Date(), -offset);
      const dateKey = localDateKey(date);
      const minutes = getHistoryDayData(dateKey).actualSeconds / 60;
      const target = state.profile.dailyMinutes || 90;
      const level = minutes <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((minutes / target) * 4)));
      const cell = document.createElement("span");
      cell.className = `heatmap-day level-${level}`;
      cell.title = `${formatLongDate(date)}: ${formatMinutes(Math.round(minutes))}`;
      const day = document.createElement("small");
      day.textContent = String(date.getDate());
      cell.append(day);
      refs.trainingHeatmap.append(cell);
    }
  }

  function renderErrorSummary(mistakes) {
    refs.errorSummary.replaceChildren();
    const entries = Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!entries.length) return;
    const label = document.createElement("strong");
    label.textContent = "Errores repetidos";
    refs.errorSummary.append(label);
    for (const [mistake, count] of entries) {
      const chip = document.createElement("span");
      chip.className = "error-chip";
      chip.textContent = `${mistake} · ${count}`;
      refs.errorSummary.append(chip);
    }
  }

  function renderSessionList(sessions) {
    refs.sessionList.replaceChildren();
    if (!sessions.length) {
      refs.sessionList.append(makeEmptyAnalytics("Completa una tarea o cierra una sesión para crear tu historial."));
      return;
    }
    for (const session of sessions.slice(0, 20)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "session-item";
      button.dataset.sessionDate = session.dateKey;
      const date = document.createElement("span");
      date.className = "session-date";
      date.innerHTML = `<strong>${dateFromKey(session.dateKey).getDate()}</strong><small>${MONTH_SHORT[dateFromKey(session.dateKey).getMonth()]}</small>`;
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = session.review?.nextFocus || `Entrenamiento del ${DAY_NAMES[dateFromKey(session.dateKey).getDay()]}`;
      const meta = document.createElement("small");
      meta.textContent = `${formatMinutes(Math.round(session.data.actualSeconds / 60))} real · ${session.data.completed}/${session.data.total} tareas${session.data.roundsCompleted ? ` · ${session.data.roundsCompleted} rondas` : ""}`;
      copy.append(title, meta);
      const metrics = document.createElement("span");
      metrics.className = "session-metrics";
      metrics.textContent = session.review?.focus
        ? `${session.review.focus}/5 foco`
        : session.data.ratings.excellent
          ? `${session.data.ratings.excellent} excelente${session.data.ratings.excellent === 1 ? "" : "s"}`
          : "Sin revisión";
      button.append(date, copy, metrics, makeIcon("chevron-right"));
      refs.sessionList.append(button);
    }
  }

  function makeEmptyAnalytics(message) {
    const element = document.createElement("p");
    element.className = "analytics-empty";
    element.textContent = message;
    return element;
  }

  function calculateStreak() {
    let streak = 0;
    for (let offset = 0; offset < 3650; offset += 1) {
      const dateKey = localDateKey(addDays(new Date(), -offset));
      const data = getHistoryDayData(dateKey);
      const active = data.actualSeconds > 0 || data.completed > 0 || Boolean(state.reviews[dateKey]);
      if (active) streak += 1;
      else if (offset === 0) continue;
      else break;
    }
    return streak;
  }

  function openSessionDetail(dateKey) {
    const data = getHistoryDayData(dateKey);
    const review = state.reviews[dateKey];
    refs.sessionDetailTitle.textContent = formatLongDate(dateFromKey(dateKey));
    refs.sessionDetailContent.replaceChildren();
    const summary = document.createElement("div");
    summary.className = "session-detail-summary";
    summary.textContent = `${formatMinutes(Math.round(data.actualSeconds / 60))} reales · ${data.completed} tareas completadas`;
    refs.sessionDetailContent.append(summary);
    const progress = state.progress[dateKey] || {};
    for (const entry of Object.values(progress)) {
      if (!entry.taskSnapshot || (!entry.actualSeconds && !entry.done)) continue;
      const row = document.createElement("div");
      row.className = "session-task-row";
      const name = document.createElement("strong");
      name.textContent = entry.taskSnapshot.title;
      const value = document.createElement("span");
      const ratingLabels = { excellent: "excelente", normal: "normal", incomplete: "incompleta" };
      value.textContent = [
        formatTimer(entry.actualSeconds),
        entry.roundsCompleted ? `${entry.roundsCompleted} rondas` : "",
        entry.sessionRating ? ratingLabels[entry.sessionRating] : "",
        entry.done ? "completada" : "",
      ].filter(Boolean).join(" · ");
      row.append(name, value);
      refs.sessionDetailContent.append(row);
    }
    if (review) {
      const reviewBox = document.createElement("div");
      reviewBox.className = "session-review-box";
      const focus = document.createElement("strong");
      focus.textContent = `Concentración ${review.focus}/5`;
      const error = document.createElement("p");
      error.textContent = review.wentWrong || "Sin error principal anotado.";
      const next = document.createElement("p");
      next.textContent = review.nextFocus ? `Siguiente foco: ${review.nextFocus}` : "";
      reviewBox.append(focus, error, next);
      refs.sessionDetailContent.append(reviewBox);
    }
    for (const tournament of getEventsForDate(dateKey).filter((event) => event.status === "completed")) {
      const result = document.createElement("div");
      result.className = "session-tournament-result";
      const title = document.createElement("strong");
      title.textContent = tournament.name;
      const detail = document.createElement("p");
      detail.textContent = [tournament.result.matches !== null ? `${tournament.result.matches} partidas` : "", tournament.result.points !== null ? `${tournament.result.points} puntos` : "", tournament.result.eliminations !== null ? `${tournament.result.eliminations} eliminaciones` : "", tournament.result.placement !== null ? `posición ${tournament.result.placement}` : ""].filter(Boolean).join(" · ");
      result.append(title, detail);
      refs.sessionDetailContent.append(result);
    }
    showModal(refs.sessionDetailDialog);
  }

  function openRoutineTools() {
    refs.copyDayDate.value = localDateKey(addDays(dateFromKey(selectedDateKey), 1));
    refs.presetName.value = "";
    renderPresetGrid();
    showModal(refs.routineToolsDialog);
  }

  function renderPresetGrid() {
    refs.presetGrid.replaceChildren();
    for (const preset of Object.values(state.routinePresets)) {
      const card = document.createElement("article");
      card.className = "preset-card";
      card.dataset.presetId = preset.id;
      const icon = document.createElement("span");
      icon.className = "preset-icon";
      icon.append(makeIcon(preset.id === "tournament" ? "trophy" : preset.id === "recovery" ? "note" : "bolt"));
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = preset.name;
      const description = document.createElement("small");
      const total = preset.tasks.reduce((sum, task) => sum + task.duration, 0);
      description.textContent = `${formatMinutes(total)} · ${preset.tasks.length} tareas`;
      copy.append(title, description);
      const apply = document.createElement("button");
      apply.type = "button";
      apply.className = "primary-button preset-apply";
      apply.dataset.presetAction = "apply";
      apply.textContent = "Aplicar";
      card.append(icon, copy, apply);
      if (!preset.builtin) {
        const remove = makeMiniButton("trash", "", `Eliminar plantilla ${preset.name}`);
        remove.dataset.presetAction = "delete";
        remove.classList.add("preset-delete");
        card.append(remove);
      }
      refs.presetGrid.append(card);
    }
  }

  async function handlePresetGridClick(event) {
    const action = event.target.closest("[data-preset-action]");
    const card = event.target.closest("[data-preset-id]");
    if (!action || !card) return;
    const preset = state.routinePresets[card.dataset.presetId];
    if (!preset) return;
    if (action.dataset.presetAction === "delete") {
      const accepted = await askConfirm({ title: "Eliminar plantilla", message: `“${preset.name}” dejará de estar disponible. Tus días actuales no cambiarán.`, acceptLabel: "Eliminar", dangerous: true });
      if (!accepted) return;
      delete state.routinePresets[preset.id];
      persist();
      renderPresetGrid();
      return;
    }
    applyPresetById(preset.id);
  }

  function applyPresetById(presetId) {
    const preset = state.routinePresets[presetId];
    if (!preset) return;
    commitTimerForDate(selectedDateKey);
    const previousPlan = state.dayPlans[selectedDateKey] ? clone(state.dayPlans[selectedDateKey]) : null;
    const plan = materializeDay(selectedDateKey, "preset");
    plan.tasks = cloneTasksWithNewIds(preset.tasks);
    plan.reason = "preset";
    plan.backupTasks = null;
    plan.backupProgress = null;
    delete plan.tournamentPresetEventId;
    if (refs.routineToolsDialog.open) refs.routineToolsDialog.close();
    persist();
    render();
    showToast(`Plantilla “${preset.name}” aplicada`, "Deshacer", () => {
      commitTimerForDate(selectedDateKey);
      if (previousPlan) state.dayPlans[selectedDateKey] = previousPlan;
      else delete state.dayPlans[selectedDateKey];
      persist();
      render();
    });
  }

  function saveCustomPreset() {
    const name = refs.presetName.value.trim();
    if (!name) {
      refs.presetName.focus();
      showToast("Escribe un nombre para la plantilla");
      return;
    }
    const id = makeId("pre");
    const now = new Date().toISOString();
    state.routinePresets[id] = { id, name, description: "Rutina personalizada", builtin: false, tasks: clone(getEffectiveTasks(selectedDateKey)), createdAt: now, updatedAt: now };
    refs.presetName.value = "";
    persist();
    renderPresetGrid();
    showToast(`Plantilla “${name}” guardada`);
  }

  function serializePresetTask(task) {
    return {
      title: String(task.title || "").slice(0, 60),
      category: CATEGORIES[task.category] ? task.category : "other",
      duration: clamp(Number(task.duration) || 1, 1, 600),
      notes: String(task.notes || "").slice(0, 180),
      goal: String(task.goal || "").slice(0, 120),
      rounds: nullableInt(task.rounds),
      mapCode: String(task.mapCode || "").trim().slice(0, 24),
      link: sanitizeUrl(task.link || ""),
    };
  }

  async function shareCurrentPreset() {
    const date = dateFromKey(selectedDateKey);
    const payload = {
      kind: "ruti-preset",
      schemaVersion: PRESET_SCHEMA_VERSION,
      name: `Rutina de ${DAY_NAMES[date.getDay()]}`,
      tasks: getEffectiveTasks(selectedDateKey).map(serializePresetTask),
    };
    if (!payload.tasks.length) {
      showToast("Añade al menos una tarea antes de compartir la plantilla");
      return;
    }
    const filename = `${safeFilename(payload.name)}.ruti-preset.json`;
    const json = JSON.stringify(payload, null, 2);
    if (typeof File === "function") {
      const file = new File([json], filename, { type: "application/json" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: payload.name, text: "Plantilla de entrenamiento de RUTI", files: [file] });
          showToast("Plantilla compartida");
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }
    }
    downloadBlob(new Blob([json], { type: "application/json;charset=utf-8" }), filename);
    showToast("Plantilla descargada");
  }

  async function importPresetFile(event) {
    const file = event.target.files?.[0];
    refs.presetImportFile.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showToast("La plantilla supera el límite de 1 MB");
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      if (!isPlainObject(payload) || payload.kind !== "ruti-preset" || Number(payload.schemaVersion) !== PRESET_SCHEMA_VERSION) {
        throw new Error("El archivo no es una plantilla RUTI compatible");
      }
      if (!Array.isArray(payload.tasks) || payload.tasks.length < 1 || payload.tasks.length > 100) {
        throw new Error("La plantilla debe contener entre 1 y 100 tareas");
      }
      const tasks = payload.tasks.map((source, index) => {
        if (!isPlainObject(source) || !String(source.title || "").trim()) throw new Error(`La tarea ${index + 1} no tiene nombre`);
        const duration = Number(source.duration);
        if (!Number.isFinite(duration) || duration < 1 || duration > 600) throw new Error(`La duración de la tarea ${index + 1} no es válida`);
        return normalizeTask({ ...serializePresetTask(source), id: makeId("tsk") });
      });
      const name = makeUniquePresetName(String(payload.name || "Plantilla importada").trim().slice(0, 35) || "Plantilla importada");
      const id = makeId("pre");
      const now = new Date().toISOString();
      state.routinePresets[id] = { id, name, description: "Plantilla importada", builtin: false, tasks, createdAt: now, updatedAt: now };
      persist();
      renderPresetGrid();
      showToast(`Plantilla “${name}” importada`);
    } catch (error) {
      showToast(error?.message || "No se pudo importar la plantilla");
    }
  }

  function makeUniquePresetName(requestedName) {
    const names = new Set(Object.values(state.routinePresets).map((preset) => preset.name.toLocaleLowerCase("es-MX")));
    let candidate = requestedName.slice(0, 35);
    let suffix = 2;
    while (names.has(candidate.toLocaleLowerCase("es-MX"))) {
      const ending = ` (${suffix})`;
      candidate = `${requestedName.slice(0, Math.max(1, 35 - ending.length))}${ending}`;
      suffix += 1;
    }
    return candidate;
  }

  async function copyCurrentDay() {
    const targetDate = refs.copyDayDate.value;
    if (!isDateKey(targetDate) || targetDate === selectedDateKey) {
      showToast(targetDate === selectedDateKey ? "Elige una fecha diferente" : "Elige una fecha válida");
      return;
    }
    const hasData = Boolean(state.dayPlans[targetDate] || Object.keys(state.progress[targetDate] || {}).length);
    if (hasData) {
      const accepted = await askConfirm({ title: "El destino ya tiene una rutina", message: refs.copyDayMode.value === "merge" ? "Añadiremos las tareas sin borrar las existentes." : "Reemplazaremos las tareas visibles. El progreso histórico se conservará.", acceptLabel: "Copiar", dangerous: refs.copyDayMode.value === "replace" });
      if (!accepted) return;
    }
    if (refs.copyDayMode.value === "replace") commitTimerForDate(targetDate);
    const plan = materializeDay(targetDate, "copied");
    const tasks = cloneTasksWithNewIds(getEffectiveTasks(selectedDateKey));
    plan.tasks = refs.copyDayMode.value === "merge" ? [...plan.tasks, ...tasks] : tasks;
    plan.reason = "copied";
    plan.updatedAt = new Date().toISOString();
    persist();
    refs.routineToolsDialog.close();
    showToast(`Rutina copiada al ${formatShortDate(dateFromKey(targetDate))}`);
  }

  async function copyCurrentWeek() {
    const accepted = await askConfirm({ title: "Copiar semana", message: "Copiaremos las siete rutinas a la semana siguiente. Omitiremos días que ya tengan progreso o cambios propios.", acceptLabel: "Copiar semana", dangerous: false });
    if (!accepted) return;
    let copied = 0;
    let skipped = 0;
    for (let index = 0; index < 7; index += 1) {
      const sourceKey = localDateKey(addDays(visibleWeekStart, index));
      const targetKey = localDateKey(addDays(visibleWeekStart, index + 7));
      if (state.dayPlans[targetKey] || Object.keys(state.progress[targetKey] || {}).length) {
        skipped += 1;
        continue;
      }
      const sourceTasks = getEffectiveTasks(sourceKey);
      const targetPlan = materializeDay(targetKey, "copied");
      targetPlan.tasks = cloneTasksWithNewIds(sourceTasks);
      targetPlan.reason = "copied";
      copied += 1;
    }
    refs.routineToolsDialog.close();
    persist();
    render();
    showToast(`${copied} días copiados${skipped ? ` · ${skipped} omitidos` : ""}`);
  }

  function cloneTasksWithNewIds(tasks) {
    return tasks.map((task) => ({ ...clone(task), id: makeId("tsk"), sourceTournamentId: undefined }));
  }

  async function fitSelectedRoutineToProfile() {
    const target = state.profile.dailyMinutes || 90;
    const tasks = getEffectiveTasks(selectedDateKey);
    const total = tasks.reduce((sum, task) => sum + task.duration, 0);
    if (!tasks.length || total === target) {
      showToast(tasks.length ? "La rutina ya coincide con tu tiempo" : "No hay tareas para ajustar");
      return;
    }
    const accepted = await askConfirm({ title: `Ajustar a ${target} minutos`, message: "Repartiremos el tiempo de forma proporcional y mantendremos todas las tareas con un mínimo de 5 minutos.", acceptLabel: "Ajustar", dangerous: false });
    if (!accepted) return;
    const plan = materializeDay(selectedDateKey, "custom");
    scaleTaskDurations(plan.tasks, target);
    refs.routineToolsDialog.close();
    persist();
    render();
    showToast(`Rutina ajustada a ${formatMinutes(plan.tasks.reduce((sum, task) => sum + task.duration, 0))}`);
  }

  function scaleTaskDurations(tasks, targetMinutes) {
    if (!tasks.length) return;
    const current = tasks.reduce((sum, task) => sum + task.duration, 0) || 1;
    tasks.forEach((task) => { task.duration = clamp(Math.round((task.duration / current) * targetMinutes), 5, 600); });
    let difference = targetMinutes - tasks.reduce((sum, task) => sum + task.duration, 0);
    let cursor = 0;
    while (difference !== 0 && cursor < 5000) {
      const task = tasks[cursor % tasks.length];
      if (difference > 0) { task.duration += 1; difference -= 1; }
      else if (task.duration > 5) { task.duration -= 1; difference += 1; }
      cursor += 1;
    }
  }

  function openProfileDialog(onboarding = false) {
    onboardingQueued = false;
    refs.profileForm.reset();
    refs.profileDialog.dataset.onboarding = String(onboarding);
    refs.profileEyebrow.textContent = onboarding ? "BIENVENIDO A RUTI V3" : "TU PERFIL";
    refs.profileDialogTitle.textContent = onboarding ? "Crea un plan que sí encaje contigo" : "Perfil y recordatorios";
    refs.skipOnboardingButton.hidden = !onboarding;
    refs.profileDialog.querySelectorAll(".profile-dismiss").forEach((button) => { button.hidden = onboarding; });
    refs.playerName.value = state.profile.name;
    refs.playerLevel.value = state.profile.skillLevel;
    refs.playerPlatform.value = state.profile.platform;
    refs.playerInput.value = state.profile.input;
    refs.playerRegion.value = state.profile.region;
    refs.playerDailyMinutes.value = String(state.profile.dailyMinutes);
    refs.playerGoal.value = state.profile.mainGoal;
    refs.playerWeaknesses.value = state.profile.weaknesses;
    refs.routineReminderEnabled.checked = state.profile.reminders.routineEnabled;
    refs.routineReminderTime.value = state.profile.reminders.routineTime;
    refs.tournamentReminderEnabled.checked = state.profile.reminders.tournamentEnabled;
    refs.tournamentReminderLead.value = String(state.profile.reminders.tournamentLead);
    refs.hydrationReminderEnabled.checked = state.profile.reminders.hydrationEnabled;
    refs.hydrationMinutes.value = String(state.profile.reminders.hydrationMinutes);
    refs.adaptProfileRoutine.checked = onboarding;
    updateNotificationStatus();
    showModal(refs.profileDialog);
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    const dailyMinutes = clamp(Number(refs.playerDailyMinutes.value) || 90, 15, 600);
    state.profile = {
      ...state.profile,
      name: refs.playerName.value.trim(), skillLevel: refs.playerLevel.value, platform: refs.playerPlatform.value,
      input: refs.playerInput.value, region: refs.playerRegion.value, dailyMinutes,
      mainGoal: refs.playerGoal.value.trim(), weaknesses: refs.playerWeaknesses.value.trim(), onboardingDone: true,
      reminders: {
        routineEnabled: refs.routineReminderEnabled.checked, routineTime: refs.routineReminderTime.value || "17:00",
        tournamentEnabled: refs.tournamentReminderEnabled.checked, tournamentLead: Number(refs.tournamentReminderLead.value) || 60,
        hydrationEnabled: refs.hydrationReminderEnabled.checked, hydrationMinutes: Number(refs.hydrationMinutes.value) || 45,
      },
    };
    if (refs.adaptProfileRoutine.checked) {
      for (const template of Object.values(state.templates)) scaleTaskDurations(template.tasks, dailyMinutes);
    }
    refs.profileDialog.close();
    persist();
    render();
    showToast("Perfil y preferencias guardados");
  }

  function skipOnboarding() {
    state.profile.onboardingDone = true;
    refs.profileDialog.close();
    persist();
    render();
    showToast("Puedes personalizar RUTI desde Perfil cuando quieras");
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      showToast("Este navegador no permite notificaciones. Usa el botón Calendario en tus torneos");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      updateNotificationStatus();
      showToast(permission === "granted" ? "Notificaciones activadas" : "Permiso de notificaciones no concedido");
    } catch {
      showToast("No se pudieron activar las notificaciones. Puedes exportar los torneos al calendario");
    }
  }

  function updateNotificationStatus() {
    if (!refs.notificationPermissionLabel) return;
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    refs.notificationPermissionLabel.textContent = permission === "granted" ? "Activadas" : permission === "denied" ? "Bloqueadas" : permission === "unsupported" ? "No disponible" : "Activar";
    refs.notificationPermissionButton.disabled = permission === "granted" || permission === "unsupported";
  }

  function checkReminders() {
    if (!state?.profile?.reminders) return;
    const now = new Date();
    const today = localDateKey(now);
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const reminders = state.profile.reminders;
    if (reminders.routineEnabled && time === reminders.routineTime) {
      fireReminderOnce(`routine-${today}-${time}`, "Tu rutina de Fortnite está lista", "Abre RUTI y empieza por la primera tarea.");
    }
    if (reminders.tournamentEnabled) {
      for (const event of getUpcomingEvents()) {
        const difference = eventDateTime(event).getTime() - now.getTime();
        if (difference > 0 && difference <= reminders.tournamentLead * 60000) {
          fireReminderOnce(`tournament-${event.id}-${reminders.tournamentLead}`, `${event.name} se acerca`, `Empieza a preparar tu setup. Inicio: ${event.startTime}.`);
        }
        if (event.checkInTime) {
          const checkInDifference = eventDateTime(event, true).getTime() - now.getTime();
          if (checkInDifference > -60000 && checkInDifference <= 300000) fireReminderOnce(`checkin-${event.id}`, `Check-in de ${event.name}`, "Es momento de confirmar tu participación.");
        }
      }
    }
    if (reminders.hydrationEnabled && state.activeTimer) {
      const elapsedMinutes = Math.floor(getActualSeconds(state.activeTimer.dateKey, state.activeTimer.taskId) / 60);
      const bucket = Math.floor(elapsedMinutes / reminders.hydrationMinutes);
      if (bucket >= 1) fireReminderOnce(`hydrate-${state.activeTimer.dateKey}-${state.activeTimer.taskId}-${bucket}`, "Pausa corta", "Toma agua, relaja las manos y vuelve con intención.");
    }
  }

  function fireReminderOnce(key, title, body) {
    if (state.reminders.fired[key]) return;
    state.reminders.fired[key] = new Date().toISOString();
    persist({ quiet: true });
    showToast(`${title}: ${body}`);
    if ("Notification" in window && Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(title, { body, icon: "./assets/icon.svg", tag: key }))
          .catch(() => {
            try { new Notification(title, { body, icon: "./assets/icon.svg", tag: key }); } catch { /* in-app toast remains available */ }
          });
      } else {
        try { new Notification(title, { body, icon: "./assets/icon.svg", tag: key }); } catch { /* in-app toast remains available */ }
      }
    }
  }

  function setupInstallExperience() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallUI();
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      updateInstallUI();
      showToast("RUTI se instaló correctamente");
    });
    updateInstallUI();
  }

  function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function updateInstallUI() {
    if (!refs.installAppButton || !refs.profileInstallButton) return;
    const installed = isStandaloneApp();
    const label = installed ? "RUTI instalada" : "Instalar RUTI";
    refs.installAppLabel.textContent = label;
    refs.profileInstallLabel.textContent = label;
    refs.installAppButton.disabled = installed;
    refs.profileInstallButton.disabled = installed;
  }

  async function installRuti() {
    closeDataMenu();
    if (isStandaloneApp()) {
      showToast("RUTI ya está instalada en este dispositivo");
      return;
    }
    if (deferredInstallPrompt) {
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await prompt.prompt();
      const choice = await prompt.userChoice.catch(() => ({ outcome: "dismissed" }));
      updateInstallUI();
      showToast(choice.outcome === "accepted" ? "Instalando RUTI…" : "Puedes instalarla cuando quieras desde Perfil");
      return;
    }
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    showToast(isAppleMobile
      ? "En Safari: toca Compartir y luego “Añadir a pantalla de inicio”"
      : "Abre el menú del navegador y elige “Instalar aplicación” o “Añadir a inicio”");
  }

  function toggleDataMenu() {
    const willOpen = refs.dataMenu.hidden;
    refs.dataMenu.hidden = !willOpen;
    refs.dataMenu.classList.remove("profile-origin");
    dataMenuReturnFocus = willOpen ? refs.dataMenuButton : null;
    refs.dataMenuButton.setAttribute("aria-expanded", String(willOpen));
    refs.profileDataMenuButton.setAttribute("aria-expanded", "false");
  }

  function openDataMenuFromProfile() {
    refs.dataMenu.hidden = false;
    refs.dataMenu.classList.add("profile-origin");
    dataMenuReturnFocus = refs.profileDataMenuButton;
    refs.dataMenuButton.setAttribute("aria-expanded", "false");
    refs.profileDataMenuButton.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => refs.installAppButton.focus());
  }

  function closeDataMenu() {
    refs.dataMenu.hidden = true;
    refs.dataMenu.classList.remove("profile-origin");
    refs.dataMenuButton.setAttribute("aria-expanded", "false");
    refs.profileDataMenuButton.setAttribute("aria-expanded", "false");
  }

  function exportBackup() {
    closeDataMenu();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ruti-respaldo-${localDateKey(new Date())}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Respaldo exportado");
  }

  async function shareBackup() {
    closeDataMenu();
    const file = new File([JSON.stringify(state, null, 2)], `ruti-respaldo-${localDateKey(new Date())}.json`, { type: "application/json" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: "Respaldo de RUTI", text: "Mis rutinas y progreso de Fortnite", files: [file] });
        showToast("Respaldo compartido");
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    exportBackup();
    showToast("Tu navegador no puede compartir archivos; descargamos el respaldo");
  }

  function exportCurrentEventToCalendar() {
    const event = state.tournaments[refs.eventId.value];
    if (!event) return;
    const start = eventDateTime(event);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const lead = state.profile.reminders.tournamentLead || 60;
    const escapeIcs = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const content = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RUTI//Fortnite Planner//ES", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:${event.id}@ruti.local`, `DTSTAMP:${formatIcsDate(new Date())}`, `DTSTART:${formatIcsDate(start)}`, `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcs(event.name)}`, `DESCRIPTION:${escapeIcs(`${event.format} · ${event.region}${event.teammate ? ` · con ${event.teammate}` : ""}\n${event.notes || ""}`)}`,
      ...(event.rulesUrl ? [`URL:${event.rulesUrl}`] : []),
      "BEGIN:VALARM", `TRIGGER:-PT${lead}M`, "ACTION:DISPLAY", `DESCRIPTION:${escapeIcs(`Prepárate para ${event.name}`)}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    downloadBlob(new Blob([content], { type: "text/calendar;charset=utf-8" }), `${safeFilename(event.name)}.ics`);
    showToast("Evento listo para añadir a tu calendario");
  }

  function formatIcsDate(date) {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function safeFilename(value) {
    return String(value || "ruti-evento").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ruti-evento";
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    refs.importFile.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = normalizeState(JSON.parse(text));
      const accepted = await askConfirm({
        title: "Importar respaldo",
        message: "Reemplazaremos los datos actuales por los del archivo. Guardaremos una copia interna del estado actual por seguridad.",
        acceptLabel: "Importar",
        dangerous: false,
      });
      if (!accepted) return;
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify(state)); } catch { /* best effort */ }
      state = imported;
      persist();
      render();
      showToast("Respaldo importado correctamente");
    } catch (error) {
      showToast(error?.message || "El archivo no es un respaldo válido de RUTI");
    }
  }

  async function resetApplication() {
    closeDataMenu();
    const accepted = await askConfirm({
      title: "Reiniciar aplicación",
      message: "Se borrarán tus rutinas, progreso, notas y torneos de este navegador. Exporta un respaldo antes si quieres conservarlos.",
      acceptLabel: "Borrar todo",
      dangerous: true,
    });
    if (!accepted) return;
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify(state)); } catch { /* best effort */ }
    state = createInitialState();
    activeView = "today";
    selectedDateKey = localDateKey(new Date());
    visibleWeekStart = startOfWeek(new Date());
    persist();
    render();
    showToast("Aplicación reiniciada");
  }

  function askConfirm({ title, message, acceptLabel, dangerous }) {
    refs.confirmTitle.textContent = title;
    refs.confirmMessage.textContent = message;
    refs.confirmAccept.textContent = acceptLabel;
    refs.confirmAccept.className = dangerous ? "danger-solid-button" : "primary-button";
    showModal(refs.confirmDialog);
    return new Promise((resolve) => { confirmResolver = resolve; });
  }

  function resolveConfirm(result) {
    if (!confirmResolver) return;
    const resolver = confirmResolver;
    confirmResolver = null;
    refs.confirmDialog.close();
    resolver(result);
  }

  function showModal(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function showToast(message, actionLabel = "", action = null) {
    clearTimeout(toastTimer);
    refs.toastMessage.textContent = message;
    undoHandler = action;
    refs.toastAction.hidden = !actionLabel;
    refs.toastAction.textContent = actionLabel;
    refs.toast.classList.add("visible");
    toastTimer = window.setTimeout(hideToast, actionLabel ? 5200 : 3100);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    refs.toast.classList.remove("visible");
    window.setTimeout(() => {
      undoHandler = null;
      refs.toastAction.hidden = true;
    }, 220);
  }

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    refs.celebration.replaceChildren();
    const colors = ["#27d8ff", "#9566ff", "#38e59a", "#ffb13b", "#ff5c78"];
    for (let index = 0; index < 34; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${4 + Math.random() * 92}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--fall-time", `${1000 + Math.random() * 900}ms`);
      piece.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
      piece.style.setProperty("--spin", `${320 + Math.random() * 720}deg`);
      piece.style.animationDelay = `${Math.random() * 180}ms`;
      refs.celebration.append(piece);
    }
    window.setTimeout(() => refs.celebration.replaceChildren(), 2300);
  }

  function makeIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#icon-${name}`);
    svg.append(use);
    return svg;
  }

  function makeId(prefix) {
    const unique = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${unique}`;
  }

  function clone(value) {
    return typeof structuredClone === "function"
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function nullableInt(value, minimum = 0) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Math.floor(Number(value));
    return Number.isFinite(number) && number >= minimum ? number : null;
  }

  function validTime(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ""))) return false;
    const [hours, minutes] = value.split(":").map(Number);
    return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
  }

  function sanitizeUrl(value) {
    const input = String(value || "").trim();
    if (!input) return "";
    try {
      const url = new URL(input);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  async function copyText(value, successMessage = "Copiado") {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      showToast(successMessage);
    } catch {
      const input = document.createElement("textarea");
      input.value = String(value || "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast(successMessage);
    }
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function localDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function isDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = dateFromKey(value);
    return !Number.isNaN(date.getTime()) && localDateKey(date) === value;
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    next.setHours(12, 0, 0, 0);
    return next;
  }

  function startOfWeek(date) {
    const safe = new Date(date);
    safe.setHours(12, 0, 0, 0);
    const distanceFromMonday = (safe.getDay() + 6) % 7;
    safe.setDate(safe.getDate() - distanceFromMonday);
    return safe;
  }

  function isoWeekday(date) {
    return date.getDay() === 0 ? 7 : date.getDay();
  }

  function formatWeekRange(start) {
    const end = addDays(start, 6);
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} ${start.getFullYear()} — ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} — ${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`;
    }
    return `${start.getDate()} — ${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`;
  }

  function formatLongDate(date) {
    return date.toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long",
    }).replace(",", "");
  }

  function formatShortDate(date) {
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
  }

  function formatTimer(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const rest = value % 60;
    return hours ? `${pad(hours)}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`;
  }

  function formatMinutes(minutes) {
    const value = Math.max(0, Math.round(Number(minutes) || 0));
    if (value < 60) return `${value} min`;
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline installation is optional; core functionality does not depend on it.
    });
  }
})();
