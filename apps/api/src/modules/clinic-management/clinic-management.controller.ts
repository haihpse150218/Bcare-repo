import { FastifyRequest, FastifyReply } from "fastify";
import { clinicManagementService } from "./clinic-management.service";
import { success } from "../../lib/response";
import { UpdateClinicProfileInput, AddDoctorToClinicInput, AddStaffToClinicInput } from "@bcare/shared";

export async function getMyClinicController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    const clinic = await clinicManagementService.getMyClinic(id);
    reply.send(success(clinic));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updateMyClinicController(
  request: FastifyRequest<{ Body: UpdateClinicProfileInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const clinic = await clinicManagementService.updateMyClinic(id, request.body);
    reply.send(success(clinic));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listDoctorsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const doctors = await clinicManagementService.listDoctors(id, role);
    reply.send(success(doctors));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function addDoctorController(
  request: FastifyRequest<{ Body: AddDoctorToClinicInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const doctor = await clinicManagementService.addDoctor(id, request.body);
    reply.status(201).send(success(doctor));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function removeDoctorController(
  request: FastifyRequest<{ Params: { doctorId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    await clinicManagementService.removeDoctor(id, request.params.doctorId);
    reply.send(success({ removed: true }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listStaffController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    const staff = await clinicManagementService.listStaff(id);
    reply.send(success(staff));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function addStaffController(
  request: FastifyRequest<{ Body: AddStaffToClinicInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const staff = await clinicManagementService.addStaff(id, request.body);
    reply.status(201).send(success(staff));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function removeStaffController(
  request: FastifyRequest<{ Params: { staffId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    await clinicManagementService.removeStaff(id, request.params.staffId);
    reply.send(success({ removed: true }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getStatsController(
  request: FastifyRequest<{ Querystring: { from?: string; to?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const stats = await clinicManagementService.getStats(id, role, request.query.from, request.query.to);
    reply.send(success(stats));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getChartDataController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const period = (request.query.period || "month") as "week" | "month" | "year";
    const data = await clinicManagementService.getChartData(id, role, period);
    reply.send(success(data));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function exportDataController(
  request: FastifyRequest<{ Querystring: { format?: string; from?: string; to?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const format = (request.query.format || "csv") as "csv" | "pdf";
    const result = await clinicManagementService.exportData(id, format, request.query.from, request.query.to);

    if (result.format === "csv") {
      const headers = ["Date", "Doctor", "Patient", "Status", "Amount", "PaymentStatus"];
      const csvRows = [headers.join(",")];
      for (const row of result.data) {
        csvRows.push([row.Date, `"${row.Doctor}"`, `"${row.Patient}"`, row.Status, row.Amount, row.PaymentStatus].join(","));
      }
      const csv = csvRows.join("\n");

      reply
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="report-${result.clinic}.csv"`)
        .send(csv);
    } else {
      // Simple text-based PDF-like export (pdfkit can be added later)
      const lines = [`BCare Report - ${result.clinic}`, `From: ${result.from} To: ${result.to}`, ""];
      for (const row of result.data) {
        lines.push(`${row.Date} | ${row.Doctor} | ${row.Patient} | ${row.Status} | ${row.Amount} | ${row.PaymentStatus}`);
      }

      reply
        .header("Content-Type", "text/plain; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="report-${result.clinic}.txt"`)
        .send(lines.join("\n"));
    }
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
