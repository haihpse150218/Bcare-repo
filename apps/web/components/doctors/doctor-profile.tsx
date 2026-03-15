import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Briefcase } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface DoctorProfileProps {
  doctor: {
    title: string;
    bio: string | null;
    experienceYears: number;
    consultationFee: number;
    ratingAvg: number;
    user: { fullName: string; avatarUrl: string | null };
    specialty: { name: string };
    clinic: { name: string; address: string; city: string } | null;
    _count: { reviews: number; appointments: number };
  };
}

export function DoctorProfile({ doctor }: DoctorProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <Avatar className="w-28 h-28 border-2 border-primary-50">
          <AvatarImage src={doctor.user.avatarUrl || undefined} alt={doctor.user.fullName} />
          <AvatarFallback className="bg-primary-50 text-primary text-2xl">
            {doctor.user.fullName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{doctor.title} {doctor.user.fullName}</h1>
          <Badge variant="secondary" className="mt-1">{doctor.specialty.name}</Badge>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-light">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {doctor.ratingAvg.toFixed(1)} ({doctor._count.reviews} đánh giá)
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {doctor.experienceYears} năm kinh nghiệm
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {doctor._count.appointments} lượt khám
            </span>
          </div>
          {doctor.clinic && (
            <p className="flex items-center gap-1 mt-2 text-sm text-text-light">
              <MapPin className="w-4 h-4" />
              {doctor.clinic.name} - {doctor.clinic.address}, {doctor.clinic.city}
            </p>
          )}
          <p className="text-lg font-semibold text-primary mt-3">{formatVND(doctor.consultationFee)}</p>
          {doctor.bio && <p className="mt-4 text-text-light">{doctor.bio}</p>}
        </div>
      </div>
    </div>
  );
}
