CREATE TYPE "public"."audit_operation" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE');--> statement-breakpoint
CREATE TYPE "public"."process_status" AS ENUM('EN_CURSO', 'COMPLETADO', 'CANCELADO', 'PAUSADO');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('PLANIFICACION', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."responsible_type" AS ENUM('RRHH', 'MANAGER', 'IT', 'EMPLEADO', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('DOCUMENTACION', 'EQUIPAMIENTO', 'ACCESOS', 'FORMACION', 'REUNIONES', 'ADMINISTRATIVO');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'BLOQUEADA', 'CANCELADA');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO');--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(100),
	"rol" "user_role" DEFAULT 'EMPLEADO' NOT NULL,
	"departamento_id" uuid,
	"manager_id" uuid,
	"avatar_url" varchar(500),
	"ultimo_acceso" timestamp with time zone,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" varchar(255),
	"mfa_recovery_codes" text[],
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "departamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"descripcion" text,
	"responsable_id" uuid,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "departamentos_nombre_unique" UNIQUE("nombre"),
	CONSTRAINT "departamentos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "plantillas_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"departamento_id" uuid,
	"rol_destino" "user_role",
	"duracion_estimada_dias" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tareas_plantilla" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plantilla_id" uuid NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"categoria" "task_category" NOT NULL,
	"responsable_tipo" "responsible_type" NOT NULL,
	"responsable_id" uuid,
	"dias_desde_inicio" integer DEFAULT 0 NOT NULL,
	"duracion_estimada_horas" numeric(5, 2),
	"orden" integer NOT NULL,
	"obligatoria" boolean DEFAULT true NOT NULL,
	"requiere_evidencia" boolean DEFAULT false NOT NULL,
	"instrucciones" text,
	"recursos_url" text[],
	"dependencias" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procesos_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empleado_id" uuid NOT NULL,
	"plantilla_id" uuid NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin_esperada" date,
	"fecha_fin_real" date,
	"estado" "process_status" DEFAULT 'EN_CURSO' NOT NULL,
	"progreso" numeric(5, 2) DEFAULT '0' NOT NULL,
	"notas" text,
	"iniciado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tareas_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proceso_id" uuid NOT NULL,
	"tarea_plantilla_id" uuid,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"categoria" "task_category" NOT NULL,
	"responsable_id" uuid NOT NULL,
	"fecha_limite" date,
	"estado" "task_status" DEFAULT 'PENDIENTE' NOT NULL,
	"prioridad" "priority" DEFAULT 'MEDIA' NOT NULL,
	"completada_at" timestamp with time zone,
	"completada_por" uuid,
	"notas" text,
	"evidencia_url" varchar(500),
	"comentarios_rechazo" text,
	"orden" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asignaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"rol" varchar(100),
	"dedicacion_porcentaje" numeric(5, 2),
	"horas_semanales" numeric(5, 2),
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "asignaciones_proyecto_usuario_fecha_unique" UNIQUE("proyecto_id","usuario_id","fecha_inicio")
);
--> statement-breakpoint
CREATE TABLE "proyectos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"descripcion" text,
	"cliente" varchar(150),
	"fecha_inicio" date,
	"fecha_fin_estimada" date,
	"fecha_fin_real" date,
	"estado" "project_status" DEFAULT 'PLANIFICACION' NOT NULL,
	"manager_id" uuid NOT NULL,
	"presupuesto_horas" numeric(10, 2),
	"horas_consumidas" numeric(10, 2) DEFAULT '0' NOT NULL,
	"prioridad" "priority" DEFAULT 'MEDIA' NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "proyectos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "timetracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"asignacion_id" uuid,
	"fecha" date NOT NULL,
	"horas" numeric(4, 2) NOT NULL,
	"descripcion" text NOT NULL,
	"facturable" boolean DEFAULT true NOT NULL,
	"estado" "time_entry_status" DEFAULT 'PENDIENTE' NOT NULL,
	"aprobado_por" uuid,
	"aprobado_at" timestamp with time zone,
	"rechazado_por" uuid,
	"rechazado_at" timestamp with time zone,
	"comentario_rechazo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timetracking_horas_check" CHECK ("timetracking"."horas" > 0 AND "timetracking"."horas" <= 24)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"operation" "audit_operation" NOT NULL,
	"usuario_id" uuid,
	"usuario_email" varchar(255),
	"old_data" jsonb,
	"new_data" jsonb,
	"changed_fields" text[],
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas_onboarding" ADD CONSTRAINT "plantillas_onboarding_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas_onboarding" ADD CONSTRAINT "plantillas_onboarding_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_plantilla" ADD CONSTRAINT "tareas_plantilla_plantilla_id_plantillas_onboarding_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_plantilla" ADD CONSTRAINT "tareas_plantilla_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procesos_onboarding" ADD CONSTRAINT "procesos_onboarding_empleado_id_users_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procesos_onboarding" ADD CONSTRAINT "procesos_onboarding_plantilla_id_plantillas_onboarding_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_onboarding"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procesos_onboarding" ADD CONSTRAINT "procesos_onboarding_iniciado_por_users_id_fk" FOREIGN KEY ("iniciado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_onboarding" ADD CONSTRAINT "tareas_onboarding_proceso_id_procesos_onboarding_id_fk" FOREIGN KEY ("proceso_id") REFERENCES "public"."procesos_onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_onboarding" ADD CONSTRAINT "tareas_onboarding_tarea_plantilla_id_tareas_plantilla_id_fk" FOREIGN KEY ("tarea_plantilla_id") REFERENCES "public"."tareas_plantilla"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_onboarding" ADD CONSTRAINT "tareas_onboarding_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas_onboarding" ADD CONSTRAINT "tareas_onboarding_completada_por_users_id_fk" FOREIGN KEY ("completada_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetracking" ADD CONSTRAINT "timetracking_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetracking" ADD CONSTRAINT "timetracking_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetracking" ADD CONSTRAINT "timetracking_asignacion_id_asignaciones_id_fk" FOREIGN KEY ("asignacion_id") REFERENCES "public"."asignaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetracking" ADD CONSTRAINT "timetracking_aprobado_por_users_id_fk" FOREIGN KEY ("aprobado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetracking" ADD CONSTRAINT "timetracking_rechazado_por_users_id_fk" FOREIGN KEY ("rechazado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_tokens_usuario_idx" ON "password_reset_tokens" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_usuario_idx" ON "refresh_tokens" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_departamento_idx" ON "users" USING btree ("departamento_id");--> statement-breakpoint
CREATE INDEX "users_manager_idx" ON "users" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "users_rol_idx" ON "users" USING btree ("rol");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "departamentos_nombre_idx" ON "departamentos" USING btree ("nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "departamentos_codigo_idx" ON "departamentos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "departamentos_responsable_idx" ON "departamentos" USING btree ("responsable_id");--> statement-breakpoint
CREATE INDEX "departamentos_deleted_at_idx" ON "departamentos" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "plantillas_departamento_idx" ON "plantillas_onboarding" USING btree ("departamento_id");--> statement-breakpoint
CREATE INDEX "plantillas_rol_destino_idx" ON "plantillas_onboarding" USING btree ("rol_destino");--> statement-breakpoint
CREATE INDEX "plantillas_created_by_idx" ON "plantillas_onboarding" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "plantillas_deleted_at_idx" ON "plantillas_onboarding" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tareas_plantilla_plantilla_idx" ON "tareas_plantilla" USING btree ("plantilla_id");--> statement-breakpoint
CREATE INDEX "tareas_plantilla_categoria_idx" ON "tareas_plantilla" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "tareas_plantilla_orden_idx" ON "tareas_plantilla" USING btree ("plantilla_id","orden");--> statement-breakpoint
CREATE INDEX "procesos_empleado_idx" ON "procesos_onboarding" USING btree ("empleado_id");--> statement-breakpoint
CREATE INDEX "procesos_plantilla_idx" ON "procesos_onboarding" USING btree ("plantilla_id");--> statement-breakpoint
CREATE INDEX "procesos_estado_idx" ON "procesos_onboarding" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "procesos_fecha_inicio_idx" ON "procesos_onboarding" USING btree ("fecha_inicio");--> statement-breakpoint
CREATE INDEX "procesos_iniciado_por_idx" ON "procesos_onboarding" USING btree ("iniciado_por");--> statement-breakpoint
CREATE INDEX "procesos_deleted_at_idx" ON "procesos_onboarding" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tareas_onboarding_proceso_idx" ON "tareas_onboarding" USING btree ("proceso_id");--> statement-breakpoint
CREATE INDEX "tareas_onboarding_responsable_idx" ON "tareas_onboarding" USING btree ("responsable_id");--> statement-breakpoint
CREATE INDEX "tareas_onboarding_estado_idx" ON "tareas_onboarding" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "tareas_onboarding_fecha_limite_idx" ON "tareas_onboarding" USING btree ("fecha_limite");--> statement-breakpoint
CREATE INDEX "tareas_onboarding_orden_idx" ON "tareas_onboarding" USING btree ("proceso_id","orden");--> statement-breakpoint
CREATE INDEX "asignaciones_proyecto_idx" ON "asignaciones" USING btree ("proyecto_id");--> statement-breakpoint
CREATE INDEX "asignaciones_usuario_idx" ON "asignaciones" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "asignaciones_fecha_inicio_idx" ON "asignaciones" USING btree ("fecha_inicio");--> statement-breakpoint
CREATE INDEX "asignaciones_deleted_at_idx" ON "asignaciones" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proyectos_codigo_idx" ON "proyectos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "proyectos_manager_idx" ON "proyectos" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "proyectos_estado_idx" ON "proyectos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "proyectos_cliente_idx" ON "proyectos" USING btree ("cliente");--> statement-breakpoint
CREATE INDEX "proyectos_deleted_at_idx" ON "proyectos" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "timetracking_usuario_idx" ON "timetracking" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "timetracking_proyecto_idx" ON "timetracking" USING btree ("proyecto_id");--> statement-breakpoint
CREATE INDEX "timetracking_asignacion_idx" ON "timetracking" USING btree ("asignacion_id");--> statement-breakpoint
CREATE INDEX "timetracking_fecha_idx" ON "timetracking" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "timetracking_estado_idx" ON "timetracking" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "timetracking_usuario_fecha_idx" ON "timetracking" USING btree ("usuario_id","fecha");--> statement-breakpoint
CREATE INDEX "timetracking_proyecto_fecha_idx" ON "timetracking" USING btree ("proyecto_id","fecha");--> statement-breakpoint
CREATE INDEX "audit_log_table_name_idx" ON "audit_log" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "audit_log_record_id_idx" ON "audit_log" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "audit_log_operation_idx" ON "audit_log" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "audit_log_usuario_id_idx" ON "audit_log" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_table_record_idx" ON "audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "audit_log_usuario_created_idx" ON "audit_log" USING btree ("usuario_id","created_at");
--> statement-breakpoint
-- Foreign keys circulares para users
ALTER TABLE "users" ADD CONSTRAINT "users_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
