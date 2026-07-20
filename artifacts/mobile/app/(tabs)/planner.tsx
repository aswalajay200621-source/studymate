import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const isWeb = Platform.OS === "web";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#0b1326",
  card:        "rgba(30, 41, 59, 0.75)",
  border:      "rgba(255, 255, 255, 0.1)",
  primary:     "#bdc2ff",
  primaryCont: "#818cf8",
  secondary:   "#b9c7e0",
  tertiary:    "#f7bd3e",
  text:        "#dae2fd",
  muted:       "#c6c5d5",
  surfaceCont: "#171f33",
  surfaceHigh: "#222a3d",
  surfaceHigh2:"#2d3449",
  surfaceLow:  "#131b2e",
};

function glassCard(extra?: object) {
  return [
    {
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    isWeb ? {
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)",
    } as any : {},
    extra ?? {},
  ];
}

// ── Month calendar data ──────────────────────────────────────────────────────
const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOffset(year: number, month: number) {
  // 0=Mon offset
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

// ── Today's schedule (default seed) ─────────────────────────────────────────
const DEFAULT_SCHEDULE = [
  { time: "09:00 — 11:30", title: "Morning Study Session", desc: "Review key concepts and practice problems.", color: C.primary },
  { time: "13:00 — 15:00", title: "Deep Focus Work", desc: "Preparing for upcoming tests. Deep analysis.", color: C.tertiary },
  { time: "16:30 — 18:00", title: "AI Assistant Sync", desc: "Reviewing notes and generating summaries.", color: C.muted },
];

// ── Quick tasks ───────────────────────────────────────────────────────────────
const INITIAL_TASKS = [
  { id: "1", text: "Submit Ethics Essay", done: true },
  { id: "2", text: "Data Science Quiz Preparation", done: false },
  { id: "3", text: "Confirm Guest Lecture slot", done: false },
  { id: "4", text: "Update bibliography", done: false },
];

// ── Planner screen ────────────────────────────────────────────────────────────
export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const topPad = isWeb ? 72 : insets.top + 16;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  // Per-date task drafts: key = "YYYY-M-D"
  const [dayTasks, setDayTasks] = useState<Record<string, string>>({});
  const [inputDraft, setInputDraft] = useState("");

  // Today's Schedule state
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editDraft, setEditDraft] = useState(DEFAULT_SCHEDULE.map((e) => ({ ...e })));

  const startEditSchedule = () => {
    setEditDraft(schedule.map((e) => ({ ...e })));
    setEditingSchedule(true);
  };
  const saveSchedule = () => {
    setSchedule(editDraft.filter((e) => e.title.trim() !== ""));
    setEditingSchedule(false);
  };
  const updateEntry = (idx: number, field: string, val: string) => {
    setEditDraft((d) => d.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };
  const deleteEntry = (idx: number) => {
    setEditDraft((d) => d.filter((_, i) => i !== idx));
  };
  const addEntry = () => {
    setEditDraft((d) => [...d, { time: "", title: "", desc: "", color: C.primary }]);
  };

  // ── Add New Task modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskDay,   setNewTaskDay]   = useState(now.getDate());
  const [newTaskMonth, setNewTaskMonth] = useState(now.getMonth());
  const [newTaskYear,  setNewTaskYear]  = useState(now.getFullYear());
  const [newTaskText,  setNewTaskText]  = useState("");

  const modalDaysInMonth = getDaysInMonth(newTaskYear, newTaskMonth);

  const prevModalMonth = () => {
    if (newTaskMonth === 0) { setNewTaskMonth(11); setNewTaskYear((y) => y - 1); }
    else setNewTaskMonth((m) => m - 1);
    setNewTaskDay(1);
  };
  const nextModalMonth = () => {
    if (newTaskMonth === 11) { setNewTaskMonth(0); setNewTaskYear((y) => y + 1); }
    else setNewTaskMonth((m) => m + 1);
    setNewTaskDay(1);
  };

  const saveNewTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const dateLabel = `${MONTHS[newTaskMonth].slice(0, 3)} ${newTaskDay}: `;
    setTasks((t) => [...t, { id: String(Date.now()), text: dateLabel + text, done: false }]);
    // Also mark on calendar grid
    const key = `${newTaskYear}-${newTaskMonth}-${newTaskDay}`;
    setDayTasks((dt) => ({ ...dt, [key]: text }));
    // Sync calendar view to that month so the dot is visible
    setMonth(newTaskMonth);
    setYear(newTaskYear);
    setNewTaskText("");
    setShowAddModal(false);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const offset      = getFirstDayOffset(year, month);
  const today       = now.getDate();
  const isThisMonth = month === now.getMonth() && year === now.getFullYear();

  const toggleTask = (id: string) =>
    setTasks((t) => t.map((tk) => (tk.id === id ? { ...tk, done: !tk.done } : tk)));

  const dayKey = (d: number) => `${year}-${month}-${d}`;

  const commitDayTask = (day: number) => {
    const raw = inputDraft.trim();
    if (!raw) return;
    const dateLabel = `${MONTHS[month].slice(0, 3)} ${day}: `;
    setTasks((t) => [
      ...t,
      { id: String(Date.now()), text: dateLabel + raw, done: false },
    ]);
    setDayTasks((dt) => ({ ...dt, [dayKey(day)]: raw }));
    setInputDraft("");
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      {/* Ambient glow blobs */}
      {isWeb && (
        <>
          <View style={[s.blob, { top: -60, left: -60, backgroundColor: "rgba(189,194,255,0.08)" }]} />
          <View style={[s.blob, { bottom: -60, right: -60, backgroundColor: "rgba(189,194,255,0.05)", width: 300, height: 300 }]} />
        </>
      )}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={s.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>{MONTHS[month]} {year}</Text>
            <Text style={s.pageSub}>
              Your schedule is optimized for maximum retention and cognitive clarity.
            </Text>
          </View>
          <View style={[s.liveBadge, { borderColor: C.border }]}>
            <View style={s.liveDot} />
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600" }}>Live Focus Sync</Text>
          </View>
        </View>

        {/* ── Main bento grid ── */}
        <View style={isDesktop ? s.bentoRow : s.bentoStack}>

          {/* LEFT: Calendar + Timeline */}
          <View style={[isDesktop ? s.leftCol : {}, { gap: 20 }]}>

            {/* Month calendar */}
            <View style={glassCard(s.calendarCard) as any}>
              {/* Nav row */}
              <View style={s.calNavRow}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity style={s.calNavBtn} onPress={prevMonth}>
                    <Feather name="chevron-left" size={18} color={C.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.calNavBtn} onPress={nextMonth}>
                    <Feather name="chevron-right" size={18} color={C.text} />
                  </TouchableOpacity>
                </View>
                <Text style={s.calMonthLabel}>{MONTHS[month]} {year}</Text>
              </View>

              {/* Weekday headers */}
              <View style={s.calGrid}>
                {DAYS.map((d) => (
                  <View key={d} style={s.calDayHeader}>
                    <Text style={s.calDayHeaderText}>{d}</Text>
                  </View>
                ))}

                {/* Empty offset cells */}
                {Array.from({ length: offset }).map((_, i) => (
                  <View key={`e${i}`} style={[s.calCell, { opacity: 0.2 }]} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day  = i + 1;
                  const isToday = isThisMonth && day === today;
                  const isSel   = day === selectedDay;
                  const savedTask = dayTasks[dayKey(day)];
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        s.calCell,
                        isToday && { backgroundColor: "rgba(189,194,255,0.10)" },
                        isSel && { backgroundColor: "rgba(189,194,255,0.15)", borderColor: C.primary },
                      ]}
                      onPress={() => {
                        setSelectedDay(day);
                        setInputDraft(dayTasks[dayKey(day)] ?? "");
                      }}
                      activeOpacity={0.75}
                    >
                      {/* Date number */}
                      <Text style={[
                        s.calDayNum,
                        isToday && { color: C.primary, fontWeight: "700" },
                        isSel  && { color: C.primary },
                      ]}>{day}</Text>

                      {/* Inline input when selected */}
                      {isSel ? (
                        <TextInput
                          style={s.calCellInput}
                          value={inputDraft}
                          onChangeText={setInputDraft}
                          onSubmitEditing={() => commitDayTask(day)}
                          placeholder="Add task…"
                          placeholderTextColor="rgba(189,194,255,0.35)"
                          returnKeyType="done"
                          blurOnSubmit
                          autoFocus
                          multiline={false}
                        />
                      ) : savedTask ? (
                        <Text style={s.calCellTaskPreview} numberOfLines={1}>{savedTask}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Today's schedule timeline */}
            <View style={glassCard(s.timelineCard) as any}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={s.sectionTitle}>Today's Schedule</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: C.muted }}>
                    {DAYS[(now.getDay() + 6) % 7]}, {MONTHS[now.getMonth()].slice(0, 3)} {today}
                  </Text>
                  <TouchableOpacity
                    onPress={editingSchedule ? saveSchedule : startEditSchedule}
                    style={[
                      s.editBtn,
                      editingSchedule && { backgroundColor: "rgba(189,194,255,0.15)", borderColor: C.primary },
                    ]}
                  >
                    <Feather name={editingSchedule ? "check" : "edit-2"} size={13} color={editingSchedule ? C.primary : C.muted} />
                    <Text style={{ fontSize: 12, color: editingSchedule ? C.primary : C.muted, fontWeight: "600" }}>
                      {editingSchedule ? "Done" : "Edit"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {editingSchedule ? (
                /* ── Edit mode ── */
                <View style={{ gap: 16 }}>
                  {editDraft.map((entry, idx) => (
                    <View key={idx} style={s.editEntryRow}>
                      {/* Color strip */}
                      <View style={{ width: 3, borderRadius: 2, backgroundColor: entry.color, alignSelf: "stretch", marginRight: 10 }} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <TextInput
                          style={s.schedInput}
                          value={entry.time}
                          onChangeText={(v) => updateEntry(idx, "time", v)}
                          placeholder="Time (e.g. 09:00 — 11:00)"
                          placeholderTextColor="rgba(189,194,255,0.3)"
                        />
                        <TextInput
                          style={[s.schedInput, { fontWeight: "700", color: C.text }]}
                          value={entry.title}
                          onChangeText={(v) => updateEntry(idx, "title", v)}
                          placeholder="Session title"
                          placeholderTextColor="rgba(189,194,255,0.3)"
                        />
                        <TextInput
                          style={[s.schedInput, { color: C.muted }]}
                          value={entry.desc}
                          onChangeText={(v) => updateEntry(idx, "desc", v)}
                          placeholder="Description"
                          placeholderTextColor="rgba(189,194,255,0.3)"
                          multiline
                        />
                      </View>
                      <TouchableOpacity onPress={() => deleteEntry(idx)} style={s.deleteBtn}>
                        <Feather name="trash-2" size={14} color="rgba(255,100,100,0.7)" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addEntryBtn} onPress={addEntry}>
                    <Feather name="plus" size={14} color={C.primary} />
                    <Text style={{ fontSize: 12, color: C.primary, fontWeight: "600" }}>Add Entry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── Read mode ── */
                <View style={{ paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: "rgba(255,255,255,0.05)" }}>
                  {schedule.map((entry, idx) => (
                    <View key={idx} style={{ marginBottom: idx < schedule.length - 1 ? 28 : 0 }}>
                      <View style={[s.timelineDot, { backgroundColor: entry.color, borderColor: C.bg }]} />
                      <Text style={[s.timelineTime, { color: entry.color }]}>{entry.time}</Text>
                      <Text style={s.timelineTitle}>{entry.title}</Text>
                      <Text style={s.timelineDesc}>{entry.desc}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* RIGHT: Widgets */}
          <View style={[isDesktop ? s.rightCol : {}, { gap: 20 }]}>

            {/* Weekly progress widget */}
            <View style={glassCard(s.widgetCard) as any}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={s.widgetTitle}>Weekly Study Progress</Text>
                <Feather name="bar-chart-2" size={20} color={C.primary} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                <Text style={s.weeklyHours}>24.5</Text>
                <Text style={{ color: C.muted, fontSize: 16, marginBottom: 4 }}> / 40h</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.primary, fontSize: 12, fontWeight: "600" }}>+12% vs LW</Text>
              </View>

              {/* Progress bar */}
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: "62%" as any, backgroundColor: C.primary }]} />
              </View>

              {/* Bar chart */}
              <View style={s.barChart}>
                {[60, 80, 95, 40, 0, 0, 0].map((h, i) => (
                  <View key={i} style={[s.bar, { height: `${h || 8}%` as any, backgroundColor: h > 0 ? (i === 2 ? C.primary : `${C.primary}66`) : C.surfaceHigh2 }]} />
                ))}
              </View>
              <View style={s.dayLabels}>
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <Text key={i} style={s.dayLabel}>{d}</Text>
                ))}
              </View>
            </View>

            {/* Quick tasks */}
            <View style={glassCard(s.widgetCard) as any}>
              <Text style={s.sectionTitle}>Quick Tasks</Text>
              <View style={{ gap: 14, marginTop: 16 }}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
                    onPress={() => toggleTask(task.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.checkbox, { borderColor: task.done ? C.primary : "rgba(189,194,255,0.3)" }]}>
                      {task.done && <Feather name="check" size={14} color={C.primary} />}
                    </View>
                    <Text style={[s.taskText, task.done && s.taskDone]}>{task.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.addTaskBtn} onPress={() => setShowAddModal(true)}>
                <Feather name="plus" size={16} color={C.primary} />
                <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600" }}>Add New Task</Text>
              </TouchableOpacity>
            </View>

            {/* Focus playlist card */}
            <View style={[glassCard(s.playlistCard) as any, { overflow: "hidden" }]}>
              <View style={s.playlistOverlay} />
              <View style={s.playlistContent}>
                <Text style={s.playlistTitle}>Focus Playlist</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Feather name="music" size={13} color={C.primary} />
                  <Text style={{ fontSize: 12, color: C.primary }}>Lofi Research Beats</Text>
                </View>
              </View>
            </View>

          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add New Task Modal ── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={s.modalTitle}>Add New Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={s.modalCloseBtn}>
                <Feather name="x" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            <Text style={s.modalLabel}>SELECT DATE</Text>
            {/* Month nav */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <TouchableOpacity style={s.calNavBtn} onPress={prevModalMonth}>
                <Feather name="chevron-left" size={16} color={C.text} />
              </TouchableOpacity>
              <Text style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>
                {MONTHS[newTaskMonth]} {newTaskYear}
              </Text>
              <TouchableOpacity style={s.calNavBtn} onPress={nextModalMonth}>
                <Feather name="chevron-right" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
            {/* Day grid */}
            <View style={s.modalDayGrid}>
              {DAYS.map((d) => (
                <Text key={d} style={s.modalDayHeader}>{d}</Text>
              ))}
              {Array.from({ length: getFirstDayOffset(newTaskYear, newTaskMonth) }).map((_, i) => (
                <View key={`e${i}`} style={s.modalDayCell} />
              ))}
              {Array.from({ length: modalDaysInMonth }).map((_, i) => {
                const d = i + 1;
                const sel = d === newTaskDay;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.modalDayCell, sel && s.modalDayCellSel]}
                    onPress={() => setNewTaskDay(d)}
                  >
                    <Text style={[s.modalDayNum, sel && { color: C.bg, fontWeight: "700" }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Task text */}
            <Text style={[s.modalLabel, { marginTop: 16 }]}>TASK</Text>
            <TextInput
              style={s.modalInput}
              value={newTaskText}
              onChangeText={setNewTaskText}
              placeholder="What do you need to do?"
              placeholderTextColor="rgba(189,194,255,0.3)"
              returnKeyType="done"
              onSubmitEditing={saveNewTask}
              autoFocus
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: "rgba(255,255,255,0.05)", flex: 1 }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={{ color: C.muted, fontWeight: "600", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: C.primary, flex: 2 }]}
                onPress={saveNewTask}
              >
                <Text style={{ color: C.bg, fontWeight: "700", fontSize: 14 }}>Save Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, position: "relative" },
  blob:          {
    position: "absolute", width: 400, height: 400, borderRadius: 200,
    ...(isWeb ? { filter: "blur(120px)" } as any : {}),
    pointerEvents: "none" as any,
  },
  scroll:        { paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  pageHeader:    { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  pageTitle:     {
    fontSize: 36, fontWeight: "700", color: C.text, letterSpacing: -0.5,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    lineHeight: 44,
  },
  pageSub:       { fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 22, flex: 1 },
  liveBadge:     {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.card,
  },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },

  // Bento layout
  bentoRow:      { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  bentoStack:    { flexDirection: "column", gap: 20 },
  leftCol:       { flex: 2 },
  rightCol:      { flex: 1, minWidth: 260 },

  // Calendar
  calendarCard:  { padding: 20 },
  calNavRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  calNavBtn:     {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  calMonthLabel: { fontSize: 15, fontWeight: "600", color: C.text },
  calGrid:       {
    flexDirection: "row", flexWrap: "wrap",
    borderTopWidth: 1, borderLeftWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  calDayHeader:  {
    width: "14.28%" as any, paddingVertical: 8, alignItems: "center",
    borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  calDayHeaderText: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1 },
  calCell:       {
    width: "14.28%" as any,
    minHeight: 72,
    padding: 5,
    alignItems: "flex-start",
    borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 0, borderLeftWidth: 0,
  },
  calDayNum:     { fontSize: 12, color: C.muted, fontWeight: "500", marginBottom: 2 },
  calDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  calCellInput:  {
    fontSize: 10, color: C.primary, fontWeight: "500",
    width: "100%" as any,
    paddingVertical: 2, paddingHorizontal: 0,
    borderBottomWidth: 1, borderBottomColor: "rgba(189,194,255,0.4)",
    backgroundColor: "transparent",
    marginTop: 2,
    ...(isWeb ? { outlineStyle: "none" } as any : {}),
  },
  calCellTaskPreview: {
    fontSize: 9, color: C.primary, fontWeight: "500",
    opacity: 0.8, marginTop: 2,
    width: "100%" as any,
  },

  // Timeline
  timelineCard:  { padding: 24 },
  timelineDot:   {
    position: "absolute", left: -26,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 3,
  },
  timelineTime:  { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  timelineTitle: {
    fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  timelineDesc:  { fontSize: 13, color: C.muted, lineHeight: 19 },
  sectionTitle:  {
    fontSize: 18, fontWeight: "700", color: C.text,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },

  // Schedule edit controls
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  editEntryRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  schedInput: {
    fontSize: 13, color: C.primary, fontWeight: "500",
    borderBottomWidth: 1, borderBottomColor: "rgba(189,194,255,0.2)",
    paddingVertical: 4, paddingHorizontal: 0,
    backgroundColor: "transparent",
    ...(isWeb ? { outlineStyle: "none" } as any : {}),
  },
  deleteBtn: {
    padding: 6, marginLeft: 6,
    alignItems: "center", justifyContent: "center",
  },
  addEntryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(189,194,255,0.2)",
    borderStyle: "dashed" as any,
  },

  // Widgets
  widgetCard:    { padding: 22 },
  widgetTitle:   { fontSize: 13, fontWeight: "600", color: C.muted, letterSpacing: 0.5 },
  weeklyHours:   { fontSize: 34, fontWeight: "700", color: C.text },
  progressTrack: { height: 10, backgroundColor: C.surfaceHigh2, borderRadius: 99, overflow: "hidden", marginBottom: 20 },
  progressFill:  { height: "100%" as any, borderRadius: 99 },
  barChart:      { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 80 },
  bar:           { flex: 1, borderRadius: 3 },
  dayLabels:     { flexDirection: "row", marginTop: 6 },
  dayLabel:      { flex: 1, textAlign: "center", fontSize: 10, color: C.muted, letterSpacing: 1 },

  // Tasks
  checkbox:      {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  taskText:      { fontSize: 13, color: C.text, flex: 1, fontWeight: "500" },
  taskDone:      { textDecorationLine: "line-through", opacity: 0.5, color: C.muted },
  addTaskBtn:    {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 18, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: "rgba(189,194,255,0.2)",
  },

  // Add Task Modal
  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 20,
    ...(isWeb ? { backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" } as any : {}),
  },
  modalCard: {
    width: "100%" as any, maxWidth: 420,
    backgroundColor: "#131b2e",
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: "rgba(189,194,255,0.15)",
    ...(isWeb ? { boxShadow: "0 24px 64px rgba(0,0,0,0.5)" } as any : {}),
  },
  modalTitle: {
    fontSize: 20, fontWeight: "700", color: C.text,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalLabel: { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, marginBottom: 8 },
  modalDayGrid: { flexDirection: "row", flexWrap: "wrap" },
  modalDayHeader: {
    width: "14.28%" as any, textAlign: "center",
    fontSize: 9, color: C.muted, fontWeight: "700", letterSpacing: 0.5,
    paddingVertical: 4,
  },
  modalDayCell: {
    width: "14.28%" as any, aspectRatio: 1,
    alignItems: "center", justifyContent: "center",
    borderRadius: 6,
  },
  modalDayCellSel: { backgroundColor: C.primary },
  modalDayNum: { fontSize: 12, color: C.text, fontWeight: "500" },
  modalInput: {
    fontSize: 14, color: C.text,
    borderWidth: 1, borderColor: "rgba(189,194,255,0.25)",
    borderRadius: 10, padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    ...(isWeb ? { outlineStyle: "none" } as any : {}),
  },
  modalBtn: {
    paddingVertical: 12, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  // Playlist
  playlistCard:  { height: 140 },
  playlistOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,19,38,0.55)",
    borderRadius: 20,
  },
  playlistContent: {
    position: "absolute", bottom: 16, left: 20,
  },
  playlistTitle: {
    fontSize: 16, fontWeight: "700", color: "#ffffff",
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
});
