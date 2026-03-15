import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

interface ClinicCardProps {
  slug: string;
  name: string;
  address: string;
  city: string;
  doctorCount: number;
  description: string | null;
}

export function ClinicCard({ slug, name, address, city, doctorCount, description }: ClinicCardProps) {
  return (
    <Link href={`/clinics/${slug}`}>
      <Card className="shadow-card hover:shadow-hover transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg text-text">{name}</h3>
          <p className="text-sm text-text-light mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 shrink-0" />
            {address}, {city}
          </p>
          <p className="text-sm text-text-light mt-1 flex items-center gap-1">
            <Users className="w-4 h-4 shrink-0" />
            {doctorCount} bác sĩ
          </p>
          {description && (
            <p className="text-sm text-text-light mt-2 line-clamp-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
