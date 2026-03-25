import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('admin123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'fananpedro@hotmail.com' },
    update: {},
    create: {
      name: 'Pedro Fanan',
      email: 'fananpedro@hotmail.com',
      passwordHash,
    },
  })

  console.log(`✅ User created: ${user.email}`)

  const personalOrg = await prisma.organization.upsert({
    where: { slug: 'pessoal-pedro' },
    update: {},
    create: {
      name: 'Pessoal - Pedro',
      slug: 'pessoal-pedro',
      type: 'PERSONAL',
    },
  })

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: personalOrg.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: personalOrg.id,
      role: 'OWNER',
    },
  })

  // Default categories for personal org
  const defaultCategories = [
    { name: 'Alimentação', color: '#f97316', icon: 'utensils' },
    { name: 'Transporte', color: '#3b82f6', icon: 'car' },
    { name: 'Moradia', color: '#8b5cf6', icon: 'home' },
    { name: 'Saúde', color: '#ef4444', icon: 'heart' },
    { name: 'Lazer', color: '#10b981', icon: 'gamepad-2' },
    { name: 'Salário', color: '#22c55e', icon: 'banknote' },
    { name: 'Freelance', color: '#eab308', icon: 'briefcase' },
    { name: 'Outros', color: '#6b7280', icon: 'circle' },
  ]

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { organizationId_name: { organizationId: personalOrg.id, name: cat.name } },
      update: {},
      create: { ...cat, organizationId: personalOrg.id },
    })
  }

  console.log(`✅ Organization created: ${personalOrg.name}`)
  console.log('🎉 Seed complete!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: fananpedro@hotmail.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
