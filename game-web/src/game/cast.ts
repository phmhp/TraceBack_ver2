// Characters in one place: change a name here and every scene follows.
// Story: an F1 driver and engineer cat duo won a record prize; their sponsor swindled the money and framed them.
// Fired and broke for years, they rob the swindler's mansion to take the prize back and race their own car
// to prove it is still the best — the escape ends on the pirate ship taking the back road to paradise.
export const CAST = {
  driver: { name: "볼트", role: "드라이버" },
  engineer: { name: "너트", role: "엔지니어" },
  villain: { name: "폭스", role: "후원사 대표" },
} as const;
export const DRIVER = CAST.driver.name;
export const ENGINEER = CAST.engineer.name;
export const DUO = `${CAST.driver.name}와 ${CAST.engineer.name}`;
