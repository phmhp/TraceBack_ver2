import { RefPuzzle } from "./features/wiring/RefPuzzle";
import { DRIVER, ENGINEER, CAST } from "./game/cast";
const VILLAIN = CAST.villain.name;
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { dispatch, hydrateCampaign, initialCampaign, type Campaign } from "./game/runtime";
import { SCENARIOS } from "./game/scenarios";
import {
  FaultDialogue,
  FailureAnalysis,
  GarageExperience,
  InvestigationBoard,
  RaceExperience,
  WiringPuzzle,
} from "./experiences";
import {
  DriveBriefing,
  RepairSequence,
  ShipBoardingSequence,
} from "./features/cutscenes/StaticCutscenes";
import { TwinBenchExperience } from "./features/verification/VerificationLab";
import {
  ActionButton,
  CommandBar,
  DialoguePanel,
  GameHeader,
  GameStage,
  JourneyNavigationProvider,
  Keycap,
  SceneBackdrop,
  StatusPill,
} from "./ui/game-shell";
import "./style.css";
import "./v5.css";
import "./v5-board.css";
import "./v5-lab.css";
import "./v5-fixes.css";
import "./v6.css";
import "./v7.css";
import "./v8.css";
import "./v9.css";
import "./v10.css";
import "./v11.css";
import "./v12.css";
import "./v13.css";
import "./v14.css";
import "./v15.css";
import "./v16.css";
import "./v17.css";
import "./v18.css";
import "./ending-v19.css";
import "./p0-v20.css";
import "./p1-type.css";
import "./p2-notepaper.css";
import "./p3-notepaper-world.css";
import "./p4-fix-1109.css";
import { BustedEnding, WantedEnding } from "./ui/CaseFileEnding";
import { SoundToggle } from "./ui/ComicBurst";
import { installGlobalSfx, setMusic, setMusicScene, setSfx, soundPrefs } from "./ui/sfx";
import { SuspectBoard } from "./features/board/SuspectBoard";
import { DominoBoard } from "./features/board/DominoBoard";
import { DominoTrace } from "./features/board/DominoTrace";
import { EeTraceV2 as EeTrace } from "./features/board/EeTrace";
import { Icon } from "./ui/Icon";
import { VerdictLayer } from "./ui/Verdict";
const A = "/assets/";
type Sim = {
  speed: number;
  lane: number;
  progress: number;
  policeGap: number;
  heat: number;
  damage: number;
};
const fresh = (): Sim => ({
  speed: 0,
  lane: 0,
  progress: 0,
  policeGap: 42,
  heat: 36,
  damage: 0,
});
function useCampaign() {
  const [state, dispatchEvent] = useReducer(dispatch, undefined, () => {
    const params = new URLSearchParams(location.search);
    if (params.has("new"))
      return initialCampaign();
    const qaScene = params.get("qa") as Campaign["scene"] | null;
    if (import.meta.env.DEV && qaScene && ["PROLOGUE", "GARAGE_L1", "DRIVE_BRIEFING", "CHASE_NORMAL", "FAULT_CUE", "BOARD", "WIRING", "TWIN_BENCH", "VERIFY_FAIL", "REPAIR", "CHASE_RESUME", "SHIP_ESCAPE", "SHIP_BOARDING", "CAUGHT", "ENDING", "PAUSE"].includes(qaScene)) {
      const isFinale = qaScene.startsWith("SHIP") || qaScene === "ENDING";
      const isResume = qaScene === "CHASE_RESUME";
      const requestedDistance = Number(params.get("distance"));
      const qaDistance = Number.isFinite(requestedDistance) && requestedDistance >= 0 ? requestedDistance : undefined;
      return hydrateCampaign({
        scene: qaScene,
        caseId: (["propulsion", "thermal", "brake"].includes(params.get("case") ?? "") ? params.get("case") : "propulsion") as Campaign["caseId"], // dev: ?qa=WIRING&case=thermal
        previousScene: qaScene === "PAUSE" ? "CHASE_NORMAL" : undefined,
        completedCases: isFinale ? ["propulsion", "thermal"] : isResume ? ["propulsion"] : [],
        evidence: { propulsion: ["pedal_raw", "pedal_processed", "torque_cmd"], thermal: [], brake: [] },
        hypothesis: { propulsion: "gateway", thermal: "", brake: "" },
        program: { propulsion: "nominal", thermal: "thermal_closed_loop", brake: "blended_brake" },
        raceDistance: qaDistance ?? (qaScene === "CHASE_NORMAL" ? 0 : qaScene === "SHIP_ESCAPE" ? 1165 : isResume ? 545 : 260),
        raceElapsedSeconds: 52,
        policeGapMeters: 72,
        checkpoint: qaScene.startsWith("SHIP") || qaScene === "ENDING" ? "dock_approach" : "propulsion_fault",
      });
    }
    try {
      // always open on the title; a saved run is offered there as "이어하기"
      return initialCampaign();
    } catch {
      return initialCampaign();
    }
  });
  const send = useCallback((event: { type: string; [key: string]: unknown }) => {
    if (event.type === "NEW_GAME") {
      // New game is a fresh investigation session; returning to title intentionally does not do this.
      try {
        for (let index = sessionStorage.length - 1; index >= 0; index--) {
          const key = sessionStorage.key(index) ?? "";
          if (key.startsWith("tb-step") || key.startsWith("tb-impact-") || key.startsWith("tb-section-") || key.startsWith("tb-expect-") || key.startsWith("tb-verification-contract-") || key.startsWith("tb-intro-")) sessionStorage.removeItem(key);
        }
        localStorage.removeItem("traceback-v16-save");
      } catch { /* storage is optional */ }
    }
    dispatchEvent(event);
  }, []);
  useEffect(() => {
    if (state.scene !== "TITLE")
      localStorage.setItem("traceback-v16-save", JSON.stringify(state));
  }, [state]);
  useEffect(() => {
    // Freeze pursuit during the warning/dialogue so the player can read it.
    // Investigation and engineering work still consume chase distance.
    const pursuitScenes = ["FAULT_CUE", "BOARD", "WIRING", "TWIN_BENCH", "VERIFY_FAIL", "REPAIR"];
    if (!pursuitScenes.includes(state.scene)) return;
    // The disabled vehicle remains exactly at the fault position while the interceptor closes in.
    const timer = window.setInterval(() => send({ type: "TICK_PURSUIT", meters: .08, seconds: 1 }), 1000);
    return () => clearInterval(timer);
  }, [state.scene]);
  // one driving track from the start of the chase until the pirate ship (fault, investigation and bench included)
  useEffect(() => {
    if (state.scene === "PAUSE") return;
    const chase = ["DRIVE_BRIEFING", "CHASE_NORMAL", "FAULT_CUE", "ASSIST_CHASE", "BOARD", "WIRING", "TWIN_BENCH", "VERIFY_FAIL", "REPAIR", "CHASE_RESUME", "OPTIONAL_FAULT", "SHIP_ESCAPE", "SHIP_BOARDING"];
    setMusicScene(chase.includes(state.scene) ? "race" : "calm");
  }, [state.scene]);
  return [state, send] as const;
}
function ToyCar({
  color = "#ef4e45",
  police = false,
}: {
  color?: string;
  police?: boolean;
}) {
  return (
    <group>
      <RoundedBox
        args={[1.85, 0.5, 3.55]}
        radius={0.24}
        smoothness={6}
        castShadow
        position={[0, 0.47, 0]}
      >
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.18} />
      </RoundedBox>
      <RoundedBox
        args={[1.6, 0.34, 1.45]}
        radius={0.2}
        smoothness={5}
        castShadow
        position={[0, 0.76, -1]}
      >
        <meshStandardMaterial color={color} roughness={0.22} />
      </RoundedBox>
      <RoundedBox
        args={[1.45, 0.78, 1.72]}
        radius={0.26}
        smoothness={6}
        castShadow
        position={[0, 1, 0.35]}
      >
        <meshStandardMaterial
          color={police ? "#eaf4ff" : "#cdeef0"}
          roughness={0.12}
          metalness={0.05}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.28, 0.08, 0.72]}
        radius={0.05}
        smoothness={3}
        position={[0, 1.12, -0.48]}
        rotation={[-0.36, 0, 0]}
      >
        <meshStandardMaterial color="#244354" roughness={0.08} />
      </RoundedBox>
      <RoundedBox
        args={[1.3, 0.12, 0.16]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.45, 1.8]}
      >
        <meshStandardMaterial color="#202b31" />
      </RoundedBox>
      <RoundedBox
        args={[1.22, 0.08, 0.7]}
        radius={0.05}
        smoothness={3}
        position={[0, 1.08, 1.16]}
        rotation={[0.38, 0, 0]}
      >
        <meshStandardMaterial
          color="#263d49"
          roughness={0.08}
          metalness={0.18}
        />
      </RoundedBox>
      {[-0.58, 0.58].map((x) => (
        <RoundedBox
          key={`tail${x}`}
          args={[0.42, 0.16, 0.06]}
          radius={0.07}
          smoothness={3}
          position={[x, 0.62, 1.79]}
        >
          <meshStandardMaterial
            color="#ff5261"
            emissive="#ff263f"
            emissiveIntensity={1.8}
          />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[0.52, 0.16, 0.04]}
        radius={0.03}
        smoothness={2}
        position={[0, 0.52, 1.84]}
      >
        <meshStandardMaterial color="#f4ead4" />
      </RoundedBox>
      {[-1.02, 1.02].map((x) => (
        <group key={`mirror${x}`} position={[x, 0.92, -0.12]}>
          <RoundedBox args={[0.28, 0.15, 0.38]} radius={0.09} smoothness={3}>
            <meshStandardMaterial color={color} roughness={0.2} />
          </RoundedBox>
        </group>
      ))}
      {[-0.57, 0.57].map((x) => (
        <mesh key={`lamp${x}`} position={[x, 0.72, -1.74]}>
          <sphereGeometry args={[0.18, 20, 12]} />
          <meshStandardMaterial
            color="#fff3bd"
            emissive="#ffd45c"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
      {[-0.67, 0.67].flatMap((x) =>
        [-1.1, 1.08].map((z) => (
          <group
            key={`${x}${z}`}
            position={[x, 0.32, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.22, 24]} />
              <meshStandardMaterial color="#182126" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.225, 16]} />
              <meshStandardMaterial color="#d9d4c7" metalness={0.6} />
            </mesh>
          </group>
        )),
      )}
      {police && (
        <>
          <RoundedBox
            args={[0.95, 0.12, 0.24]}
            radius={0.05}
            smoothness={3}
            position={[0, 1.48, 0.18]}
          >
            <meshStandardMaterial color="#17232e" />
          </RoundedBox>
          <mesh position={[-0.25, 1.57, 0.18]}>
            <boxGeometry args={[0.42, 0.12, 0.18]} />
            <meshStandardMaterial
              color="#ff3558"
              emissive="#ff1538"
              emissiveIntensity={2}
            />
          </mesh>
          <mesh position={[0.25, 1.57, 0.18]}>
            <boxGeometry args={[0.42, 0.12, 0.18]} />
            <meshStandardMaterial
              color="#4ca9ff"
              emissive="#248eff"
              emissiveIntensity={2}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
function Tree({ x, z, shade }: { x: number; z: number; shade: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 2, 10]} />
        <meshStandardMaterial color="#8f6544" />
      </mesh>
      <mesh castShadow position={[0, 2.25, 0]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color={shade} roughness={0.9} />
      </mesh>
    </group>
  );
}
function WorldScene({ sim, ship }: { sim: Sim; ship: boolean }) {
  const player = useRef<THREE.Group>(null!);
  useFrame(({ camera }) => {
    const px = sim.lane,
      pz = -sim.progress;
    player.current.position.x = THREE.MathUtils.lerp(
      player.current.position.x,
      px,
      0.16,
    );
    player.current.position.z = pz;
    player.current.rotation.z = THREE.MathUtils.lerp(
      player.current.rotation.z,
      -(px - player.current.position.x) * 0.08,
      0.15,
    );
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      px * 0.42,
      0.08,
    );
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.15, 0.07);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, pz + 6.7, 0.1);
    camera.lookAt(px * 0.55, 0.72, pz - 7.8);
  });
  return (
    <>
      <fog attach="fog" args={[ship ? "#eeb27c" : "#b9e7e6", 42, 150]} />
      <hemisphereLight intensity={1.6} color="#fff6d8" groundColor="#477464" />
      <directionalLight
        castShadow
        position={[-12, 20, 12]}
        intensity={2.5}
        shadow-mapSize={[2048, 2048]}
      />
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, -170]}
      >
        <planeGeometry args={[70, 420]} />
        <meshStandardMaterial color="#78b77c" roughness={1} />
      </mesh>
      {Array.from({ length: 34 }, (_, i) => (
        <group key={i} position={[0, 0, -i * 12]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 12]} />
            <meshStandardMaterial color="#46545a" roughness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <planeGeometry args={[0.16, 3.2]} />
            <meshStandardMaterial color="#fff1b8" />
          </mesh>
          {[-5.7, 5.7].map((x, j) => (
            <React.Fragment key={x}>
              <RoundedBox
                args={[2.6, 1.3 + (i % 3) * 0.35, 3.8]}
                radius={0.28}
                smoothness={4}
                castShadow
                position={[x, 0.65 + (i % 3) * 0.17, 0]}
              >
                <meshStandardMaterial
                  color={["#f29a77", "#70b7b0", "#f0c96d", "#8ea8d1"][i % 4]}
                  roughness={0.7}
                />
              </RoundedBox>
              {i % 3 === 0 && (
                <Tree
                  x={x > 0 ? x - 2.2 : x + 2.2}
                  z={0}
                  shade={j ? "#5da56d" : "#6fbb7d"}
                />
              )}
              <mesh position={[x > 0 ? 4.65 : -4.65, 2, 2]}>
                <cylinderGeometry args={[0.07, 0.1, 4, 8]} />
                <meshStandardMaterial color="#40535a" />
              </mesh>
              <mesh position={[x > 0 ? 4.65 : -4.65, 4, 2]}>
                <sphereGeometry args={[0.18, 12, 8]} />
                <meshStandardMaterial
                  color="#fff2ae"
                  emissive="#ffe17b"
                  emissiveIntensity={1.3}
                />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      ))}
      <group ref={player} position={[sim.lane, 0.02, -sim.progress]}>
        <ToyCar />
      </group>
      <group
        position={[
          Math.sin(sim.progress * 0.025) * 1.3,
          0.02,
          -sim.progress + Math.max(7, sim.policeGap * 0.18),
        ]}
      >
        <ToyCar color="#356dc2" police />
      </group>
      {ship && (
        <group position={[0, 0, -145]}>
          <mesh rotation={[-0.16, 0, 0]} position={[0, 0.5, 8]} receiveShadow>
            <boxGeometry args={[5, 0.5, 16]} />
            <meshStandardMaterial color="#9b653b" roughness={0.9} />
          </mesh>
          <RoundedBox
            args={[15, 3.5, 22]}
            radius={0.8}
            smoothness={6}
            position={[0, 1, -6]}
            castShadow
          >
            <meshStandardMaterial color="#67402d" roughness={0.8} />
          </RoundedBox>
          <mesh position={[0, 8, -7]}>
            <cylinderGeometry args={[0.18, 0.25, 14, 12]} />
            <meshStandardMaterial color="#3b291f" />
          </mesh>
          <mesh position={[3, 8, -7]} rotation={[0, 0.18, 0]}>
            <planeGeometry args={[7, 9]} />
            <meshStandardMaterial color="#f5e6bd" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </>
  );
}
function RaceWorld({ sim, ship }: { sim: Sim; ship: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3.15, 6.7], fov: 58 }}
      dpr={[1, 1.5]}
    >
      <WorldScene sim={sim} ship={ship} />
    </Canvas>
  );
}
function Header({ state, send }: { state: Campaign; send: React.Dispatch<any> }) {
  const s = SCENARIOS[state.caseId];
  const beforeRace = state.scene.startsWith("GARAGE");
  return (
    <GameHeader
      chapter={beforeRace ? "GARAGE · VEHICLE LOGIC LAB" : "INCIDENT INVESTIGATION"}
      title={s.title}
      distanceMeters={beforeRace ? undefined : state.policeGapMeters}
      onPause={() => send({ type: "PAUSE" })}
    />
  );
}
function Title({
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const saved = (() => { try { const raw = localStorage.getItem("traceback-v16-save"); return raw ? JSON.parse(raw) as Partial<Campaign> : null; } catch { return null; } })();
  const [panel, setPanel] = useState<"none" | "settings" | "keys">("none");
  const [prefs, setPrefsState] = useState(soundPrefs());
  const STAGE_NAME: Record<string, string> = { GARAGE_L1: "차고지", DRIVE_BRIEFING: "범행·도주", CHASE_NORMAL: "주행", FAULT_CUE: "주행", BOARD: "원인 역추적", WIRING: "로직 퍼즐", TWIN_BENCH: "검증", VERIFY_FAIL: "검증", REPAIR: "수리", CHASE_RESUME: "주행", SHIP_ESCAPE: "해적선", SHIP_BOARDING: "해적선" };
  const savedLabel = saved?.scene && STAGE_NAME[saved.scene] ? `${STAGE_NAME[saved.scene]} 단계 · 추격차와 ${Math.round(saved.policeGapMeters ?? 0)}m` : null;
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Enter" && panel === "none") { event.preventDefault(); if (savedLabel && saved) send({ type: "LOAD_SAVE", save: saved }); else send({ type: "NEW_GAME" }); } if (event.key === "Escape") setPanel("none"); };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, [panel, savedLabel]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="titleScene">
      <SceneBackdrop image={`${A}stitch23/menu-garage.png`} position="center" shade="soft" />
      <div className="titleMenu">
        <div className="eyebrow">자동차 고장 추적 · 레이싱 추리</div>
        <h1>
          <img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" />
          <span>TraceBack</span>
          <small>증상에서 원인까지, 검증으로 증명하기</small>
        </h1>
        <nav className="titleActions">
          {savedLabel && saved && <button className="heroBtn" onClick={() => send({ type: "LOAD_SAVE", save: saved })}><span><b>이어하기</b><small>{savedLabel}</small></span></button>}
          <button className={savedLabel ? "titleBtn" : "heroBtn"} onClick={() => send({ type: "NEW_GAME" })}><span><b>새 게임 시작</b></span></button>
          <div className="titleRow">
            <button className="titleBtn" onClick={() => setPanel(panel === "settings" ? "none" : "settings")}>설정</button>
            <button className="titleBtn" onClick={() => setPanel(panel === "keys" ? "none" : "keys")}>조작법</button>
          </div>
        </nav>
        {panel === "settings" && <div className="titlePanel">
          <label><input type="checkbox" checked={prefs.sfx} onChange={() => { setSfx(!prefs.sfx); setPrefsState(soundPrefs()); }} /> 효과음 (버튼·모터·제동·충돌)</label>
          <label><input type="checkbox" checked={prefs.music} onChange={() => { setMusic(!prefs.music); setPrefsState(soundPrefs()); }} /> 배경음 (타이틀·차고)</label>
          <small>레이싱 배경음은 주행 화면 오른쪽 아래 음표 버튼으로 켜고 끕니다.</small>
        </div>}
        {panel === "keys" && <div className="titlePanel keys">
          <span><kbd>↑</kbd> 가속 · <kbd>↓</kbd> 브레이크</span><span><kbd>←</kbd><kbd>→</kbd> 조향</span><span><kbd>1</kbd>~<kbd>4</kbd> 기어 P·R·N·D</span><span><kbd>Q</kbd><kbd>E</kbd> 회생 제동 강·약</span><span><kbd>R</kbd> READY(시동)</span><span><kbd>Enter</kbd> 대화 넘기기 · 시작</span>
        </div>}
      </div>
    </div>
  );
}
function Prologue({ send }: { send: React.Dispatch<any> }) {
  const [slide, setSlide] = useState(0);
  // Enter / Space advance the story (same as the button; the title screen promises Enter = 대화 넘기기)
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.repeat || (event.key !== "Enter" && event.code !== "Space")) return; event.preventDefault(); if (slide < 4) setSlide(slide + 1); else send({ type: "CONTINUE_PROLOGUE" }); };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [send, slide]);
  // story (see src/game/cast.ts): champions → swindled and framed → fired and broke → take it back → race to the ship
  const lines: [string, string, string][] = [
    ["우승", "이야기", `${DRIVER}와 ${ENGINEER}는 직접 만든 차로 시즌 우승을 하고 최고 상금을 받았다.`],
    ["누명", "이야기", `후원사 대표 ${VILLAIN}가 상금을 빼돌리고, 경기 조작 누명을 두 사람에게 씌웠다.`],
    ["해고", "이야기", "두 사람은 팀에서 해고되었고, 오랫동안 일 없이 지냈다."],
    ["계획", "이야기", `상금은 ${VILLAIN}의 저택 금고에 있다. 돈을 되찾고, 직접 만든 차로 실력을 증명하기로 했다.`],
    ["목표", "이야기", "항구 뒷길로 달려 해적선에 오른다. 경찰이 따라오기 전에."],
  ];

  const images = [
    `${A}stitch23/prologue-race.png`,
    `${A}stitch23/prologue-loss.png`,
    `${A}stitch23/prologue-loss.png`,
    `${A}stitch23/prologue-plan.png`,
    `${A}stitch23/prologue-plan.png`,
  ];
  return (
    <div className="cinematic">
      <SceneBackdrop image={images[slide]} shade="deep" />
      <div className="cinTop">
        <b>프롤로그 {slide + 1}/{lines.length}</b>
        <span>{lines[slide][0]}</span>
        <button onClick={() => send({ type: "CONTINUE_PROLOGUE" })}>
          건너뛰기 »
        </button>
      </div>
      <DialoguePanel
        portrait={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`}
        speaker={lines[slide][1]}
        action={
          <ActionButton
            tone="primary"
            keyHint="Enter"
            onClick={() => slide < lines.length - 1 ? setSlide(slide + 1) : send({ type: "CONTINUE_PROLOGUE" })}
          >계속</ActionButton>
        }
      >
        {lines[slide][2]}
      </DialoguePanel>
    </div>
  );
}
const layers = [
  {
    n: "01",
    title: "Vehicle / System",
    tag: "운전자 요구 → 차량 기능",
    text: "가속 요구가 구동력으로 이어지는 전체 기능을 확인합니다.",
    nodes: ["가속 요구", "토크 생성", "차량 가속"],
  },
  {
    n: "02",
    title: "E/E Architecture",
    tag: "센서 · ECU · 액추에이터",
    text: "APS 센서, 게이트웨이 ECU, 인버터, 모터의 신호 경로입니다.",
    nodes: ["APS 센서", "Gateway ECU", "PMSM 모터"],
  },
  {
    n: "03",
    title: "ECU SW Architecture",
    tag: "입력 처리 → 제어 계산 → 명령",
    text: "필터, 페달 매핑, 토크 명령 컴포넌트를 확인합니다.",
    nodes: ["Signal Filter", "Pedal Map", "Torque Command"],
  },
  {
    n: "04",
    title: "SW Detailed Design",
    tag: "조건 · 계산 · 보호",
    text: "60% 입력이 올바른 명령으로 유지되는지 계산 규칙을 봅니다.",
    nodes: ["raw = 60%", "scale = 1.00", "processed = 60%"],
  },
];
const garageDomains = [
  { id: "drive", icon: "⚡", label: "구동", flow: ["가속 요구", "VCU 토크 판단", "PMSM 구동"] },
  { id: "brake", icon: "◉", label: "제동", flow: ["제동 요구", "회생·마찰 배분", "감속 응답"] },
  { id: "steer", icon: "↔", label: "조향", flow: ["조향 입력", "EPS 보조 판단", "휠 각도"] },
  { id: "power", icon: "⏻", label: "전원", flow: ["START 입력", "HV 안전 판단", "READY 출력"] },
] as const;
function Garage({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const idx = Number(state.scene.slice(-1)) - 1,
    c = layers[idx];
  const [domain, setDomain] = useState<(typeof garageDomains)[number]["id"]>("drive");
  const activeDomain = garageDomains.find((item) => item.id === domain)!;
  return (
    <div className="garageScene">
      <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center 55%" shade="soft" />
      <Header state={state} send={send} />
      <aside className="garageRail">
        <b>차량 학습 4단계</b>
        {layers.map((x, i) => (
          <div className={i === idx ? "active" : ""} key={x.n}>
            <span>{x.n}</span>
            <small>{x.title}</small>
          </div>
        ))}
      </aside>
      <main className="garageMain">
        <nav className="garageDomains" aria-label="차량 도메인">
          {garageDomains.map((item) => (
            <button
              key={item.id}
              className={domain === item.id ? "active" : ""}
              onClick={() => setDomain(item.id)}
            >
              <span>{item.icon}</span><b>{item.label}</b>
            </button>
          ))}
        </nav>
        <div className="garageTitle">
          <span>LEVEL {idx + 1} · {activeDomain.label} 도메인</span>
          <h1>{c.title}</h1>
          <p>{idx === 0 ? `${activeDomain.flow[0]}가 ${activeDomain.flow[2]}으로 이어지는 목적을 확인합니다.` : c.text}</p>
        </div>
        <img className="heroCar" src={`${A}traceback-red-ev-v2.png`} />
        <div className="signalPath">
          {activeDomain.flow.map((n, i) => (
            <React.Fragment key={n}>
              <button>
                <small>
                  {i === 0 ? "DRIVER / SENSOR" : i === 1 ? "ECU DECISION" : "VEHICLE RESPONSE"}
                </small>
                <b>{n}</b>
                <span>● {idx === 0 ? "PURPOSE" : idx === 1 ? "E/E PATH" : idx === 2 ? "SW PORT" : "CONDITION"}</span>
              </button>
              {i < 2 && <i>→</i>}
            </React.Fragment>
          ))}
        </div>
        <div className="catCoach">
          <img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} />
          <div>
            <b>수석 엔지니어 {ENGINEER}</b>
            <p>{idx === 3 ? "설계 흐름을 확인했으면 실제 주행에서 증상을 만나보자냥!" : "입력에서 차량 반응까지 세 노드를 차례로 확인해보자냥."}</p>
          </div>
        </div>
        <button
          className="primary garageNext"
          onClick={() =>
            send({ type: idx === 3 ? "START_RACE" : "GARAGE_ADVANCE" })
          }
        >
          {idx === 3 ? "테스트 드라이브 시작 →" : "다음 설계 관점 →"}
        </button>
      </main>
    </div>
  );
}
function Race({
  state,
  send,
  mode,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
  mode: "normal" | "assist" | "resume" | "ship";
}) {
  const [sim, setSim] = useState<Sim>(() => ({
      ...fresh(),
      heat: state.caseId === "thermal" ? 66 : 36,
    })),
    keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        keys.current.add(e.key.toLowerCase());
        if (e.key === "Escape") send({ type: "PAUSE" });
      },
      up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    let last = performance.now(),
      acc = 0,
      raf = 0;
    const loop = () => {
      const now = performance.now();
      acc += Math.min(100, now - last);
      last = now;
      let n = 0;
      while (acc >= 20 && n++ < 5) {
        setSim((o) => {
          const k = keys.current;
          let target = k.has("w") || k.has("arrowup") ? 72 : 0;
          if (mode === "assist") target = 32;
          if (state.caseId === "thermal" && mode === "resume")
            target = Math.min(target, 42);
          if (mode === "normal" && o.progress > 78)
            target = Math.min(target, 28);
          if (mode === "resume" && state.caseId === "propulsion" && o.heat > 68)
            target = Math.min(target, 34);
          let speed = THREE.MathUtils.lerp(o.speed, target, 0.025);
          if (k.has("s") || k.has("arrowdown"))
            speed = Math.max(0, speed - 3.2);
          let lane = THREE.MathUtils.clamp(
              o.lane +
                (k.has("a") || k.has("arrowleft") ? -0.11 : 0) +
                (k.has("d") || k.has("arrowright") ? 0.11 : 0),
              -3.2,
              3.2,
            ),
            progress = o.progress + speed * 0.011;
          return {
            speed,
            lane,
            progress,
            damage: 0,
            policeGap: THREE.MathUtils.clamp(
              o.policeGap + (speed - 28) * 0.00045,
              20,
              80,
            ),
            heat: THREE.MathUtils.clamp(
              o.heat + (mode === "resume" && state.caseId === "propulsion" ? speed * 0.0065 : -0.08),
              35,
              92,
            ),
          };
        });
        acc -= 20;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, [mode, state.caseId, send]);
  useEffect(() => {
    if (mode === "normal" && sim.progress > 115)
      send({ type: "FAULT_CUE", caseId: "propulsion" });
    if (mode === "resume" && state.caseId === "propulsion" && sim.progress > 115)
      send({ type: "FAULT_CUE", caseId: "thermal" });
    if (mode === "resume" && state.caseId === "thermal" && sim.progress > 85)
      send({ type: "OPTIONAL_BRAKE", accept: false });
    if (
      mode === "ship" &&
      sim.progress > 130 &&
      Math.abs(sim.lane) < 1.5 &&
      sim.speed > 45
    )
      send({ type: "FINISH_ESCAPE", distance: 1110, gap: Math.max(10, sim.policeGap) });
  }, [sim, mode, state.caseId, send]);
  const symptomActive =
    (mode === "normal" && sim.progress > 78) ||
    (mode === "resume" && state.caseId === "propulsion" && sim.heat > 68);
  return (
    <div className="raceScene">
      <SceneBackdrop
        image={`${A}stitch23/${mode === "ship" ? "ship-escape.png" : "coast-overlook.png"}`}
        position={mode === "ship" ? "center" : "center 42%"}
        shade="none"
      />
      <RaceWorld sim={sim} ship={mode === "ship"} />
      <div className="raceTop">
        <button className="raceLogo" onClick={() => send({ type: "PAUSE" })}>Trace<span>Back</span></button>
        <b>CHAPTER {mode === "ship" ? "FINAL" : "04"}</b>
        <span>
          {mode === "ship"
            ? "마지막 부두 · 해적선 탈출"
            : "테스트 드라이브 · 항구 진입"}
        </span>
        <em>● SYSTEM {mode === "assist" ? "LIMITED" : "ACTIVE"}</em>
      </div>
      <div className="pursuit">
        <span>추격 차량</span>
        <b>{Math.round(sim.policeGap * 10)}m</b>
        <i>
          <em style={{ width: `${Math.max(8, 100 - sim.policeGap * 2)}%` }} />
        </i>
      </div>
      <div className="speed">
        <b>{Math.round(sim.speed)}</b>
        <span>KM/H</span>
        <small>
          {state.caseId === "thermal"
            ? `${Math.round(sim.heat)}°C`
            : "HV READY"}
        </small>
      </div>
      {symptomActive && (
        <div className="driveSymptom" role="status">
          <span>⚠ 주행 이상 체험 중</span>
          <b>{mode === "normal" ? "가속 입력은 유지되지만 출력이 자연스럽게 떨어집니다" : "온도가 오르며 보호 제한이 개입합니다"}</b>
          <small>원인은 아직 공개되지 않습니다 · 안전하게 계속 주행하세요</small>
        </div>
      )}
      <div className="objective">
        <b>
          {mode === "ship" ? "해적선 중앙 램프 진입" : "항구 탈출로 #4번 부두"}
        </b>
        <span>
          {Math.max(
            0,
            Math.round((mode === "ship" ? 130 : 115) - sim.progress),
          ) * 20}
          m
        </span>
      </div>
      <div className="controls">
        <b>W / S</b> 가속·제동 <b>A / D</b> 조향 <b>ESC</b> 일시정지
      </div>
      {mode === "assist" && sim.progress <= 42 && (
        <div className="safeZoneGuide">제한 출력으로 안전 구역까지 이동 · {Math.max(0, Math.round(42 - sim.progress) * 20)}m</div>
      )}
      {mode === "assist" && sim.progress > 42 && (
        <button
          className="primary investigate"
          onClick={() => send({ type: "OPEN_BOARD" })}
        >
          안전 구역 정차 · 조사 시작
        </button>
      )}
    </div>
  );
}
function FaultCue({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const s = SCENARIOS[state.caseId];
  return (
    <div className="faultCue">
      <SceneBackdrop image={`${A}stitch23/fault-breakdown.png`} position="center" shade="deep" />
      <div className="faultCard">
        <small>⚠ EVENT TRACE CAPTURED</small>
        <h1>{s.title}</h1>
        <p>{s.symptom}</p>
        <div className="trace">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="metrics">
          <span>
            RAW INPUT<b>{state.caseId === "propulsion" ? "60%" : "100%"}</b>
          </span>
          <span>
            COMMAND<b>{state.caseId === "propulsion" ? "27%" : "ON"}</b>
          </span>
          <span>
            ACTUAL<b>{state.caseId === "propulsion" ? "91 Nm" : "0 RPM"}</b>
          </span>
        </div>
        <button
          className="primary"
          onClick={() => send({ type: "CONTINUE_FAULT" })}
        >
          Quick Replay 확인 완료 →
        </button>
      </div>
    </div>
  );
}
function Evidence({
  e,
  selected,
  onClick,
}: {
  e: any;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`evidence ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <small>{e.kind}</small>
      <b>{e.label}</b>
      <em>{e.value}</em>
      <span>{selected ? "✓ 선택됨 · 다시 눌러 취소" : "핀 선택"}</span>
    </button>
  );
}
function Board({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const s = SCENARIOS[state.caseId],
    sel = state.evidence[state.caseId];
  return (
    <div className="boardScene">
      <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
      <Header state={state} send={send} />
      <div className="boardHead">
        <div>
          <small>08-01 · STEP 1 증거 선택 / STEP 2 원인 후보</small>
          <h1>메모판 추리 · {s.title}</h1>
        </div>
        <span>
          {sel.length}/{s.evidence.length} 증거 확보
        </span>
      </div>
      <main className="cork">
        <section>
          <h2>1 · 주행 기록</h2>
          {s.evidence.slice(0, 2).map((e) => (
            <Evidence
              key={e.id}
              e={e}
              selected={sel.includes(e.id)}
              onClick={() => send({ type: "RECORD_EVIDENCE", id: e.id })}
            />
          ))}
        </section>
        <section>
          <h2>2 · 관찰된 증상 / 진단 단서</h2>
          <div className="symptomCard">
            <small>OBSERVED</small>
            <b>{s.symptom}</b>
          </div>
          {s.evidence.slice(2).map((e) => (
            <Evidence
              key={e.id}
              e={e}
              selected={sel.includes(e.id)}
              onClick={() => send({ type: "RECORD_EVIDENCE", id: e.id })}
            />
          ))}
        </section>
        <section>
          <h2>3 · 원인 후보 · 하나 선택</h2>
          {s.hypotheses.map((h, i) => (
            <button
              key={h.id}
              className={`hypothesis ${state.hypothesis[state.caseId] === h.id ? "selected" : ""}`}
              onClick={() => send({ type: "SELECT_HYPOTHESIS", id: h.id })}
              aria-pressed={state.hypothesis[state.caseId] === h.id}
            >
              <span>H0{i + 1}</span>
              <b>{h.label}</b>
              <small>{h.desc} · 다시 누르면 선택 취소</small>
            </button>
          ))}
        </section>
      </main>
      <div className="coach">
        <img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} />
        <p>
          기록과 증상을 연결하고 원인 후보를 골라보자냥. 틀린 후보도 시험 결과로 반박할 수 있어!
        </p>
      </div>
      <button
        className="primary boardNext"
        disabled={sel.length < 2 || !state.hypothesis[state.caseId]}
        onClick={() => send({ type: "OPEN_WIRING" })}
      >
        다음: 로직 복원 퍼즐 →
      </button>
    </div>
  );
}
function Wiring({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const sw = state.caseId === "propulsion";
  const fixedInput = sw ? "APS 센서" : state.caseId === "thermal" ? "온도 센서" : "제동 요청";
  const fixedOutput = sw ? "PMSM 모터" : state.caseId === "thermal" ? "냉각 팬" : "마찰 제동기";
  const initialSlots = [fixedInput, "", "", "", fixedOutput];
  const [slots, setSlots] = useState(initialSlots);
  const blocks = sw
    ? ["신호 필터", "토크 맵 100%", "토크 맵 45%", "CAN 모터 명령"]
    : ["명령 로깅", "VCU 명령", "실제 응답 비교", "SW 강제 해제"];
  const requirement = sw
    ? ["페달 입력", "IF 유효 신호", "VCU 토크 계산", "THEN 모터 명령", "차량 가속"]
    : state.caseId === "thermal"
      ? ["온도 입력", "IF 65°C 초과", "VCU 안전 판단", "THEN 팬 ON", "냉각 응답"]
      : ["제동 입력", "IF 제동 요청", "VCU 배분 판단", "THEN 마찰 명령", "감속 응답"];
  const place = (b: string) => {
    const n = [...slots];
    const i = n.findIndex((x, index) => index > 0 && index < 4 && !x);
    n[i < 0 ? 2 : i] = b;
    setSlots(n);
  };
  const program =
    sw && slots.includes("토크 맵 100%") && slots.includes("CAN 모터 명령")
      ? "nominal"
      : sw
        ? "underreport_45pct"
        : "inspect_only";
  return (
    <div className="wiringScene">
      <SceneBackdrop image={`${A}stitch23/prologue-plan.png`} position="center" shade="soft" />
      <Header state={state} send={send} />
      <div className="workTop">
        <small>08-D · E/E 아키텍처 배선 작업대</small>
        <b>미션: 요구사항을 보고 HW와 SW 5개 블록 연결</b>
        <button onClick={() => setSlots(initialSlots)} aria-label="배선 초기화">↻</button>
      </div>
      <main className="workbench">
        <div className="requirementFlow" aria-label="차량 요구사항 흐름">
          {requirement.map((item, index) => (
            <React.Fragment key={item}>
              <div className={`requirementStep step-${index}`}>
                <small>{index === 0 ? "INPUT" : index === 1 ? "IF" : index === 2 ? "ECU" : index === 3 ? "THEN" : "OUTPUT"}</small>
                <b>{item}</b>
              </div>
              {index < requirement.length - 1 && <i>→</i>}
            </React.Fragment>
          ))}
        </div>
        <div className="eeBoard">
          <div className="eeLegend"><span>● HW</span><span>● SW</span><span>● SIGNAL / COMMAND</span></div>
          <div className="chain">
          <section>
            {slots.map((x, i) => (
              <React.Fragment key={i}>
                <button
                  className={`${x ? "filled" : ""} ${i === 0 || i === 4 ? "fixed hw" : "sw"}`}
                  onClick={() => {
                    if (i === 0 || i === 4) return;
                    const n = [...slots];
                    n[i] = "";
                    setSlots(n);
                  }}
                >
                  <small>{i === 0 || i === 4 ? `HW ${i === 0 ? "INPUT" : "OUTPUT"}` : `SW ${String(i).padStart(2, "0")}`}</small>
                  {(i === 0 || i === 2 || i === 4) && <img src={`${A}${i === 0 ? "ASSET_090_Input_Sensor_Node.png" : i === 2 ? "ASSET_091_ECU_Controller_Node.png" : "ASSET_092_Actuator_Node.png"}`} alt="" />}
                  <b>{x || "빈 슬롯"}</b>
                  <span>{i === 0 || i === 4 ? "고정 HW" : x ? "클릭하면 제거" : "트레이에서 선택"}</span>
                </button>
                {i < slots.length - 1 && <i>↔</i>}
              </React.Fragment>
            ))}
          </section>
          </div>
          <p className="connectionHint">포트 방향 · 신호 종류 · 단위를 확인하세요. 논리 선택은 다음 시험대에서 결과로 검증됩니다.</p>
        </div>
        <div className="parts">
          <b>부품 트레이 · 클릭해서 빈 SW 슬롯에 조립</b>
          <div>
            {blocks.map((b) => (
              <button key={b} onClick={() => place(b)}>
                {b}
                <small>{b.includes("45%") || b.includes("강제") ? "주의: 대안 블록" : "호환 블록"}</small>
              </button>
            ))}
          </div>
        </div>
      </main>
      <button
        className="primary compile"
        disabled={slots.slice(1, 4).some((x) => !x)}
        onClick={() => {
          send({ type: "COMPILE", program });
          send({ type: "OPEN_BENCH" });
        }}
      >
        배선 통전 테스트 · 쌍둥이 시험대로 ›
      </button>
    </div>
  );
}
function Rig({
  title,
  color,
  running,
  output,
  levels,
}: {
  title: string;
  color: string;
  running: boolean;
  output: string;
  levels: { label: string; detail: string; ok: boolean }[];
}) {
  return (
    <section className={`rig ${color}`}>
      <h2>{title}</h2>
      <div className={`fan ${running ? "spin" : ""}`}>✣</div>
      <div className="traceLine">
        <i />
        <i />
        <i />
        <i />
      </div>
      <p>
        입력 신호 <b>{running ? "RUNNING" : "STABLE"}</b>
      </p>
      <p>
        관측 출력 <b>{output}</b>
      </p>
      <div className="levelChecks">
        {levels.map((level) => (
          <div className={level.ok ? "ok" : "bad"} key={level.label}>
            <span>{level.ok ? "✓" : "!"}</span>
            <b>{level.label}</b>
            <small>{level.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
function Bench({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const tests = [
    { id: "normal", label: "정상", icon: "●", desc: "정상 입력·기준 응답" },
    { id: "fault", label: "고장", icon: "⚠", desc: "증상 조건 재현" },
    { id: "recovery", label: "복귀", icon: "↻", desc: "수정 후 보호 회귀" },
  ] as const;
  const [activeTest, setActiveTest] = useState<(typeof tests)[number]["id"]>("normal");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const s = SCENARIOS[state.caseId];
  const goodHyp = state.hypothesis[state.caseId] === s.root;
  const goodProgram = state.caseId === "propulsion"
    ? state.program.propulsion === "nominal"
    : state.program[state.caseId] === "inspect_only";
  const rootPass = goodHyp && goodProgram;
  const currentPass = activeTest === "normal"
    ? (state.caseId === "propulsion" ? goodProgram : true)
    : rootPass;
  const currentDone = Object.prototype.hasOwnProperty.call(results, activeTest);
  const allDone = tests.every((test) => Object.prototype.hasOwnProperty.call(results, test.id));
  const allPass = allDone && tests.every((test) => results[test.id]);
  const referenceLevels = [
    { label: "로직 수준", detail: "조건·명령 일치", ok: true },
    { label: "HILS 관점", detail: "신호·인터페이스", ok: true },
    { label: "시스템 수준", detail: "차량 응답 정상", ok: true },
  ];
  const playerLevels = [
    { label: "로직 수준", detail: currentPass ? "판단 블록 일치" : "조건/가설 불일치", ok: currentPass },
    { label: "HILS 관점", detail: currentPass ? "명령 전달 일치" : "기대/실제 차이", ok: currentPass },
    { label: "시스템 수준", detail: currentPass ? "응답 범위 충족" : "증상 재발", ok: currentPass },
  ];
  return (
    <div className="benchScene">
      <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
      <Header state={state} send={send} />
      <div className="testDeck">
        <div><small>08-E · 시험 카드</small><b>동일 초기 상태 · 동일 시간축</b></div>
        {tests.map((test) => (
          <button
            key={test.id}
            className={activeTest === test.id ? "active" : ""}
            onClick={() => setActiveTest(test.id)}
          >
            <span>{test.icon}</span><b>{test.label}</b><small>{results[test.id] === undefined ? test.desc : results[test.id] ? "PASS" : "FAIL"}</small>
          </button>
        ))}
      </div>
      <div className="benchRecipe">
        {["시험 입력", "IF 조건문", "VCU 보호", "THEN 제어", "액추에이터"].map(
          (x, i) => (
            <React.Fragment key={x}>
              <div>
                <small>{i + 1}</small>
                <b>{x}</b>
                <span>
                  {i === 1
                    ? s.title
                    : i === 3
                      ? state.program[state.caseId]
                      : "READY"}
                </span>
              </div>
              {i < 4 && <i>→</i>}
            </React.Fragment>
          ),
        )}
      </div>
      <main className="twin">
        <div className="benchCoach">
          <img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} />
          <b>정비사 {ENGINEER}의 정밀 진단</b>
          <p>동일 초기 상태와 입력으로 기준/사용자 모델을 비교한다냥.</p>
        </div>
        <Rig
          title="RIG A · 기준 모델"
          color="green"
          running={running}
          levels={referenceLevels}
          output={
            state.caseId === "propulsion" ? "60% / 204 Nm" : "COMMAND 100%"
          }
        />
        <Rig
          title="RIG B · 사용자 모델"
          color={currentDone ? (results[activeTest] ? "green" : "red") : "orange"}
          running={running}
          levels={playerLevels}
          output={
            state.caseId === "propulsion"
              ? goodProgram
                ? "60% / 204 Nm"
                : "27% / 92 Nm"
              : goodHyp
                ? "ACTUAL 0 RPM"
                : "SW OUTPUT OK"
          }
        />
      </main>
      <div className="benchBottom">
        <span>
          선택 시험 <b>{tests.find((test) => test.id === activeTest)?.label}</b>
        </span>
        <button
          className="runBtn"
          disabled={running}
          onClick={() => {
            setRunning(true);
            setTimeout(() => {
              setRunning(false);
              setResults((previous) => ({ ...previous, [activeTest]: currentPass }));
            }, 900);
          }}
        >
          {running ? "시험 실행 중…" : `⚡ ${activeTest === "normal" ? "정상" : activeTest === "fault" ? "고장" : "복귀"} 시험`}
        </button>
        {currentDone && (
          <div className={results[activeTest] ? "verdict pass" : "verdict fail"}>
            <b>{results[activeTest] ? "PASS" : "FAIL"}</b>
            <span>{results[activeTest] ? "3수준 관측 일치" : "비교 결과 불일치"}</span>
          </div>
        )}
        <button
          className="primary"
          disabled={!allDone}
          onClick={() => send({ type: "BENCH_RESULT", pass: allPass })}
        >
          {!allDone ? `시험 ${Object.keys(results).length}/3` : allPass ? "복구 판단으로 →" : "실패 분석 →"}
        </button>
      </div>
    </div>
  );
}
function VerifyFail({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  return (
    <div className="verifyFail">
      <SceneBackdrop image={`${A}stitch23/fail-rain.png`} position="center" shade="deep" />
      <Header state={state} send={send} />
      <main>
        <StatusPill tone="coral">TEST RESULT · REQUIREMENT MISMATCH</StatusPill>
        <h1>검증 실패</h1>
        <p>기준과 실제 출력이 달라요. 이 결과는 새 증거로 보존했습니다.</p>
        <div className="diff">
          <span>
            EXPECTED
            <b>{state.caseId === "propulsion" ? "60%" : "COMMAND ≠ ACTUAL"}</b>
          </span>
          <span>
            ACTUAL<b>{state.caseId === "propulsion" ? "27%" : "0 RPM"}</b>
          </span>
        </div>
        <CommandBar label={<><Keycap>ESC</Keycap> 실패 기록은 자동 저장</>}>
          <ActionButton tone="neutral" onClick={() => send({ type: "OPEN_BOARD" })}>
            원인 역추적으로
          </ActionButton>
          <ActionButton tone="primary" keyHint="ENTER" onClick={() => send({ type: "RETRY_WIRING" })}>
            정상 동작 다시 복원
          </ActionButton>
        </CommandBar>
      </main>
    </div>
  );
}
function Repair({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const s = SCENARIOS[state.caseId];
  return (
    <div className="repairScene">
      <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
      <Header state={state} send={send} />
      <main>
        <div className="caseResolved">✓ ROOT CAUSE VERIFIED</div>
        <h1>{s.title} 복구 판단</h1>
        <p>
          확인된 원인: <b>{s.hypotheses.find((h) => h.id === s.root)?.label}</b>
        </p>
        <div className="repairCard">
          <img
            src={`${A}${state.caseId === "thermal" ? "ASSET_030_Radiator_Cooling_Fan_TRANSPARENT.png" : "ASSET_091_ECU_Controller_Node.png"}`}
          />
          <div>
            <small>
              {state.caseId === "propulsion"
                ? "SOFTWARE PATCH"
                : "PARKED SERVICE"}
            </small>
            <h2>{s.repair}</h2>
            <p>
              검증에서 확인한 SW 수정본을 적용합니다.
            </p>
          </div>
        </div>
        <button
          className="primary"
          onClick={() => send({ type: "APPLY_REPAIR" })}
        >
          복구 적용 및 주행 복귀 →
        </button>
      </main>
    </div>
  );
}
function Optional({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  return (
    <div className="optionalScene">
      <SceneBackdrop image={`${A}stitch23/harbor-approach.png`} position="center" shade="deep" />
      <Header state={state} send={send} />
      <main>
        <small>OPTIONAL INCIDENT DETECTED</small>
        <h1>제동 응답 불균형</h1>
        <p>
          해적선 출항까지 시간이 얼마 남지 않았습니다. 추가 조사를 하거나 제한
          상태로 탈출할 수 있습니다.
        </p>
        <div>
          <button
            className="secondary"
            onClick={() => send({ type: "OPTIONAL_BRAKE", accept: false })}
          >
            건너뛰고 탈출
          </button>
          <button
            className="primary"
            onClick={() => send({ type: "OPTIONAL_BRAKE", accept: true })}
          >
            선택 사건 조사 →
          </button>
        </div>
      </main>
    </div>
  );
}
function Ending({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  const score = Math.max(0, 100 - state.collisions * 8 - state.hints * 4);
  return (
    <div className="ending">
      <SceneBackdrop image={`${A}stitch23/ship-escape.png`} position="center" shade="deep" />
      <nav>
        <b>CASE FILE // TB-16</b>
        <span>INCIDENT VERDICT</span>
        <span>TELEMETRY LOG</span>
        <span>SUSPECT PROFILES</span>
      </nav>
      <main>
        <aside>
          <img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} />
          <strong>ESCAPED! 탈출 성공</strong>
          <small>CASE CLOSED — PURSUIT FAILED</small>
        </aside>
        <section>
          <small>● OFFICIAL POLICE INCIDENT REPORT</small>
          <h1>사건 종결 수사 보고서</h1>
          <p>네오 베이 항만 레이스 추격 및 부두 탈출 작전</p>
          <div className="rank">
            <b>{score >= 85 ? "S" : score >= 70 ? "A" : "B"}</b>
            <span>
              최종 판정<strong>탈출 성공 (ESCAPED: YES)</strong>
            </span>
          </div>
          <div className="reportGrid">
            <span>
              필수 사건
              <b>
                {state.completedCases.filter((x) => x !== "brake").length} / 2
                완료
              </b>
            </span>
            <span>
              선택 사건
              <b>
                {state.optionalBrake === "accepted" ? "조사 완료" : "건너뜀"}
              </b>
            </span>
            <span>
              운전 성과<b>{score}점</b>
            </span>
            <span>
              검증 실행<b>{state.benchRuns}회</b>
            </span>
          </div>
          <div className="chart">
            <i style={{ width: `${score}%` }} />
          </div>
          <button onClick={() => send({ type: "TITLE" })}>메인 메뉴로</button>
          <button
            className="primary"
            onClick={() => send({ type: "NEW_GAME" })}
          >
            새 사건 시작 →
          </button>
        </section>
      </main>
    </div>
  );
}
function Overlay({
  state,
  send,
}: {
  state: Campaign;
  send: React.Dispatch<any>;
}) {
  return (
    <div className="overlay">
      <SceneBackdrop image={`${A}stitch23/coast-overlook.png`} position="center" shade="deep" />
      <div>
        <div className="pauseBrand"><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><span>TraceBack</span></div>
        <h1>{state.scene === "CAUGHT" ? "이어서 하기" : "일시정지"}</h1>
        <p>
          {state.scene === "CAUGHT"
            ? "발견한 증거와 해결 기록은 유지됩니다."
            : "현재 사건과 선택 내용은 자동 저장되었습니다."}
        </p>
        <ActionButton
          tone="primary"
          keyHint="ESC"
          onClick={() =>
            send({
              type: state.scene === "CAUGHT" ? "RETRY_CHECKPOINT" : "RESUME",
            })
          }
        >
          {state.scene === "CAUGHT" ? "현재 기록에서 이어서 하기" : "계속하기"}
        </ActionButton>
        <ActionButton tone="neutral" onClick={() => send({ type: "TITLE" })}>처음으로 돌아가기</ActionButton>
      </div>
    </div>
  );
}
function App() {
  const [state, send] = useCampaign();
  const canGoBack = ["GARAGE_L1", "GARAGE_L2", "GARAGE_L3", "GARAGE_L4", "DRIVE_BRIEFING", "WIRING", "TWIN_BENCH", "VERIFY_FAIL", "REPAIR"].includes(state.scene);
  const frame = (view: React.ReactNode) => <JourneyNavigationProvider campaign={state} navigate={stage => send({ type: "NAV_STAGE", stage })}>{view}{(canGoBack || state.forwardScene) && <nav className="stageHistoryNav" aria-label="단계 이동">{canGoBack && <button className="stageBackButton" onClick={() => send({ type: "NAV_BACK" })}><i>←</i><span>이전 단계</span></button>}{state.forwardScene && <button className="stageForwardButton" onClick={() => send({ type: "NAV_FORWARD" })}><span>다음 단계</span><i>→</i></button>}</nav>}<VerdictLayer /></JourneyNavigationProvider>;
  if (state.scene === "TITLE") return <Title state={state} send={send} />;
  if (state.scene === "PROLOGUE") return frame(<Prologue send={send} />);
  if (state.scene.startsWith("GARAGE"))
    return frame(<GarageExperience state={state} send={send} />);
  if (state.scene === "DRIVE_BRIEFING")
    return frame(<DriveBriefing state={state} send={send} />);
  if (state.scene === "CHASE_NORMAL")
    return frame(<RaceExperience state={state} send={send} mode="normal" />);
  if (state.scene === "ASSIST_CHASE")
    return frame(<RaceExperience state={state} send={send} mode="assist" />);
  if (state.scene === "CHASE_RESUME")
    return frame(<RaceExperience state={state} send={send} mode="resume" />);
  if (state.scene === "SHIP_ESCAPE")
    return frame(<RaceExperience state={state} send={send} mode="ship" />);
  if (state.scene === "FAULT_CUE")
    return frame(<FaultDialogue state={state} send={send} />);
  if (state.scene === "BOARD") return frame(<EeTrace state={state} send={send} />); // stage 1 v2 (E/E board + mugshots); DominoTrace / DominoBoard / InvestigationBoard / SuspectBoard kept unused
  if (state.scene === "WIRING") return frame(<RefPuzzle state={state} send={send} />); // old WiringPuzzle kept unused
  if (state.scene === "TWIN_BENCH") return frame(<TwinBenchExperience state={state} send={send} />);
  if (state.scene === "VERIFY_FAIL")
    return frame(<FailureAnalysis state={state} send={send} />);
  if (state.scene === "REPAIR") return frame(<RepairSequence state={state} send={send} />);
  if (state.scene === "OPTIONAL_FAULT") return frame(<RaceExperience state={state} send={send} mode="ship" />);
  if (state.scene === "SHIP_BOARDING") return frame(<ShipBoardingSequence send={send} />);
  if (state.scene === "ENDING") return frame(<WantedEnding state={state} send={send} />);
  if (state.scene === "CAUGHT") return frame(<BustedEnding state={state} send={send} />);
  return frame(<Overlay state={state} send={send} />);
}
const devShowroom = import.meta.env.DEV && new URLSearchParams(location.search).get("showroom") === "car";
const devPartShowroom = import.meta.env.DEV && new URLSearchParams(location.search).get("showroom") === "parts";
const VehicleShowroom = import.meta.env.DEV
  ? React.lazy(() => import("./features/vehicle/VehicleShowroom").then(module => ({ default: module.VehicleShowroom })))
  : null;
const PartShowroom = import.meta.env.DEV
  ? React.lazy(() => import("./features/parts/PartShowroom").then(module => ({ default: module.PartShowroom })))
  : null;
installGlobalSfx();
createRoot(document.getElementById("root")!).render(
  devShowroom && VehicleShowroom
    ? <React.Suspense fallback={null}><VehicleShowroom /></React.Suspense>
    : devPartShowroom && PartShowroom
      ? <React.Suspense fallback={null}><PartShowroom /></React.Suspense>
      : <><GameStage><App /></GameStage><SoundToggle /></>,
);
