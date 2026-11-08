import Svg, { Circle, Path, Rect } from "react-native-svg";

type P = { size?: number; color?: string };
const S = ({ size = 22, children }: { size?: number; children: React.ReactNode }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>;

export const HomeIcon = ({ size, color = "#64748B" }: P) => <S size={size}><Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke={color} strokeWidth={2} strokeLinejoin="round" /></S>;
export const DumbbellIcon = ({ size, color = "#64748B" }: P) => <S size={size}><Path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" stroke={color} strokeWidth={2.2} strokeLinecap="round" /></S>;
export const CardIcon = ({ size, color = "#64748B" }: P) => <S size={size}><Rect x={3} y={5} width={18} height={14} rx={3} stroke={color} strokeWidth={2} /><Path d="M3 10h18M7 15h4" stroke={color} strokeWidth={2} strokeLinecap="round" /></S>;
export const UserIcon = ({ size, color = "#64748B" }: P) => <S size={size}><Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} /><Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" /></S>;
export const FlameIcon = ({ size, color = "#F97316" }: P) => <S size={size}><Path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.5 1.5 2 2.5 2C11 8 11 5.5 12 3z" fill={color} /></S>;
export const ClockIcon = ({ size, color = "#16A34A" }: P) => <S size={size}><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} /><Path d="M12 7v5l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" /></S>;
export const CalendarIcon = ({ size, color = "#2563EB" }: P) => <S size={size}><Rect x={3} y={5} width={18} height={16} rx={3} stroke={color} strokeWidth={2} /><Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" /></S>;
export const CheckIcon = ({ size, color = "#fff" }: P) => <S size={size}><Path d="m5 12.5 4.5 4.5L19 7.5" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /></S>;
export const PlayIcon = ({ size, color = "#fff" }: P) => <S size={size}><Path d="M8 5.5v13l11-6.5z" fill={color} /></S>;
export const PauseIcon = ({ size, color = "#16A34A" }: P) => <S size={size}><Rect x={6.5} y={5} width={4} height={14} rx={1.2} fill={color} /><Rect x={13.5} y={5} width={4} height={14} rx={1.2} fill={color} /></S>;
export const BackIcon = ({ size, color = "#172033" }: P) => <S size={size}><Path d="m9 5 7 7-7 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></S>;
export const TrophyIcon = ({ size, color = "#F59E0B" }: P) => <S size={size}><Path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M10 15h4v3h-4zM8 21h8" stroke={color} strokeWidth={2} strokeLinejoin="round" /></S>;
export const BulbIcon = ({ size, color = "#F59E0B" }: P) => <S size={size}><Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" stroke={color} strokeWidth={2} strokeLinejoin="round" /></S>;
