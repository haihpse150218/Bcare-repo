import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface DoctorCardProps {
  slug: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  specialty: string;
  clinicName: string | null;
  city: string | null;
  ratingAvg: number;
  reviewCount: number;
  consultationFee: number;
}

export function DoctorCard({ slug, name, title, avatarUrl, specialty, clinicName, city, ratingAvg, reviewCount, consultationFee }: DoctorCardProps) {
  return (
    <Card className="shadow-card hover:shadow-hover transition-shadow">
      <CardContent className="p-6 text-center">
        <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary-50">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className="bg-primary-50 text-primary text-lg">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-text">{title} {name}</h3>
        <Badge variant="secondary" className="mt-1">{specialty}</Badge>
        {city && (
          <p className="text-sm text-text-light mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {city}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 mt-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{ratingAvg.toFixed(1)}</span>
          <span className="text-sm text-text-light">({reviewCount})</span>
        </div>
        <p className="text-sm font-medium text-primary mt-2">{formatVND(consultationFee)}</p>
        <Link href={`/doctors/${slug}`}>
          <Button className="w-full mt-3 bg-primary hover:bg-primary-600" size="sm">
            Đặt lịch khám
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
