'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function Page() {
    const [userData, setUserData] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [horarios, setHorarios] = useState<any[]>([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [selectedHoraryId, setSelectedHoraryId] = useState<number | null>(null);
    const [selectedVoluntaryId, setSelectedVoluntaryId] = useState<number | null>(null);
    const router = useRouter();
    
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/auth/usuario');
            return;
        }

        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }

        const fetchEventDetails = async () => {
            try {
                const responseEvents = await fetch('http://127.0.0.1:8000/events/admin/all/');
                const eventsData = await responseEvents.json();
    
                const userEmail = userData?.email;
    
                const updatedEvents = await Promise.all(
                    eventsData.map(async (event: any) => {
                    const responseScale = await fetch(`http://127.0.0.1:8000/scale/${event.id}/`);
                    const scaleData = await responseScale.json();
                    
                    const organizerName = await fetchOrganizerName(event.organizator);

                    if (scaleData && Array.isArray(scaleData[0]?.horarys)) {
                        const isUserRegistered = scaleData[0].horarys.some((hour: any) =>
                            hour.voluntarys.some((voluntary: any) => voluntary.user.email === userEmail)
                        );
    
                        return {
                            ...event,
                            registered: isUserRegistered,
                            scaleData,
                            organizer: organizerName || 'Desconhecido',
                        };
                    }
    
                    return event;
                }));
    
                const filteredEvents = updatedEvents.filter(event => event.registered);
    
                setEvents(filteredEvents);
            } catch (error) {
                console.error("Erro ao buscar os eventos e dados de escala:", error);
            }
        };
    
        fetchEventDetails();

    }, [userData?.email]);

    const fetchOrganizerName = async (organizerEmail: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/organization/${organizerEmail}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar nome do organizador');
            }

            const data = await response.json();
            return data.users?.name || 'Desconhecido';
        } catch (error) {
            console.error('Erro ao buscar nome do organizador', error);
            return 'Desconhecido';
        }
    };

    const cancelRegistration = async (horaryId: number, voluntaryId: number) => {
        console.log("ID do Horário: ",horaryId);
        console.log("ID do Voluntário: ", voluntaryId);
            try {
                const deleteUrl = `http://127.0.0.1:8000/scale/${horaryId}/delete/${voluntaryId}/`;
        
                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (deleteResponse.ok) {
                    alert('Inscrição cancelada com sucesso!');

                setEvents((prevEvents) =>
                    prevEvents
                        .map((event) => ({
                            ...event,
                            scaleData: event.scaleData.map((scale: any) => ({
                                ...scale,
                                horarys: scale.horarys.filter((hour: any) => hour.id !== horaryId),
                            })),
                        }))
                        .filter((event) => 
                            event.scaleData.some((scale: any) => scale.horarys.some((hour: any) => hour.voluntarys.length > 0))
                        )
                );

                setHorarios((prevHorarios) =>
                    prevHorarios.filter((horario) => horario.id !== horaryId)
                );

                closeConfirmModal();
                closeModal();
            } else {
                throw new Error(`Erro ao cancelar inscrição: ${deleteResponse.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao cancelar inscrição:', error instanceof Error ? error.message : error);
        }
    };
    const openModal = (horarios: any[]) => {
        setHorarios(horarios);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    
    const openConfirmModal = (horaryId: number, volunteerId: number) => {
        setSelectedHoraryId(horaryId);
        setSelectedVoluntaryId(volunteerId);
        setIsConfirmModalOpen(true);
        closeModal();
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        openModal(horarios);
    };

    const baseUrl = "http://127.0.0.1:8000";

    return (
        <div className="flex h-screen border border-white">
            <div className="absolute top-0 left-64 right-0 z-10 border border-white h-16">
                <section className="relative flex justify-between items-center p-4 bg-cian text-white h-full">
                <Link href="/dashboard/usuario" passHref>
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-6 w-6"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                            />
                            </svg>
                        </div>
                    </Link>
                    <h1 className="text-lg font-semibold items-center">Suas Inscrições como Voluntário</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-white">
                                    <Image
                                        src='/images/usuario1.png'
                                        alt= "Foto do Usuário"
                                        width= {48}
                                        height= {48}
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-sm"> {userData?.name || 'Usuário'} </p>
                                    <p className="text-xs text-gray-300"> {userData?.email || 'email@exemplo.com'} </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="w-64 flex flex-col justify-between border border-white bg-cian">
                <div className="flex flex-col items-left p-4 bg-cian border border-cian">
                    <div className="mb-7 mx-auto bg-light-gray p-4 rounded-lg">
                        <Image
                            className="object-contain object-left"
                            src="/images/logo_sem_fundo.png"
                            height={120}
                            width={120}
                            alt="Logo Azure"
                        />
                    </div>
                    <div className="border-t text-white border-white bg-cian">
                        <div className="px-1 mt-2">
                            <ul className="space-y-4">
                                <li>
                                    <Link
                                        href="/dashboard/usuario"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                        </svg>
                                        <span className="text-sm">Início</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/usuario/eventos"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                                        </svg>
                                        <span className="text-sm">Eventos</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/usuario/inscricoes_voluntario"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
                                        </svg>

                                        <span className="text-sm">Inscrições como voluntariado</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/usuario/inscricoes_participante"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>

                                        <span className="text-sm">Inscrições como participante</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/usuario/lista_de_espera"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 3h12M6 21h12M8 3v2a6 6 0 0 0 4 5.659V13.34A6 6 0 0 0 8 19v2m8-18v2a6 6 0 0 1-4 5.659V13.34A6 6 0 0 1 16 19v2"/>
                                        </svg>

                                        <span className="text-sm">Lista de Espera</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/usuario/convites"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 16.5v-9m19.5 0a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5m19.5 0L12 13.5 2.25 7.5" />
                                        </svg>
                                        <span className="text-sm">Convites</span>
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="/dashboard/usuario/configuracoes"
                                        className="group relative flex items-center space-x-2 rounded-xl px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 opacity-75"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        <span className="text-sm">Configurações</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white text-black" style={{ marginTop: '4rem', overflow: 'auto' }}>
                <div className="p-6 overflow-y-auto">
                    {events.length > 0 ? (
                        events.map((event: any, index: number) => (
                            <article
                                key={index}
                                className="hover:animate-background rounded-xl bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 p-0.5 shadow-xl transition hover:bg-[length:400%_400%] hover:shadow-sm hover:[animation-duration:_4s] mb-4"
                            >
                                <div className="rounded-[10px] bg-white p-2 sm:p-4 flex flex-col sm:flex-row justify-between ">
                                    <div className="rounded-[10px] bg-white p-2 sm:p-4 flex flex-col sm:flex-row justify-between">
                                        <div className="flex-1 pr-4 text-xs sm:text-sm text-gray-600">
                                            <h2 className="text-sm sm:text-lg font-semibold mb-1">
                                                <p><strong>Evento:</strong></p>
                                            </h2>
                                            <h2 className="text-xs sm:text-sm font-semibold mb-1">
                                                <strong>{event.description}</strong>
                                            </h2>
                                            <p className="text-xs sm:text-sm">
                                                <strong>Localização:</strong> {event.location}
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                                <strong>Data de Início do Evento: </strong>
                                                {new Date(event.begin).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                <strong> Horário do Evento: </strong>
                                                {new Date(event.begin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                                <strong>Data de Término do Evento: </strong>
                                                {new Date(event.end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                <strong> Horário do Evento: </strong>
                                                {new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                            </p>
                                            <p className="mt-2 text-xs sm:text-sm">
                                                <strong>Organizador do Evento:</strong> {event.organizer}
                                            </p>
                                            <h2 className="mt-2 text-sm sm:text-lg font-semibold mb-1">
                                                <p><strong>Detalhes da Sua Inscrição:</strong></p>
                                            </h2>
                                            {event.scaleData && event.scaleData[0]?.horarys.map((hour: any) => {
                                                const volunteerHour = hour.voluntarys.find((voluntary: any) => voluntary.user.email === userData?.email);
                                                if (volunteerHour) {
                                                    const formattedDate = new Date(hour.datetime).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                                                    const formattedTime = new Date(hour.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });

                                                    return (
                                                        <div key={hour.id} className="mt-2 text-xs sm:text-sm">
                                                            <p><strong>Data do Voluntariado:</strong> {formattedDate}</p>
                                                            <p><strong>Horário do Voluntariado:</strong> {formattedTime}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-28 ">
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-white bg-gray rounded-lg hover:bg-red-700 transition-all border border-red flex items-center"
                                            onClick={() => openModal(event.scaleData[0]?.horarys || [])}
                                            >
                                            <i className="fas fa-times mr-2  "></i>
                                            Gerenciar Inscrições
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="flex justify-center items-start mt-64">
                            <p><strong>Você não está inscrito em nenhum evento.</strong></p>
                        </div>
                    )}
                </div>
                    {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-8 h-[600px]">
                            <div className="flex justify-between items-center border-b pb-4 text-gray">
                                <h2 className="text-2xl text-red-500 font-bold">Cancelar Agendamento da Inscrição</h2>
                                <button className="text-red-500 font-bold hover:text-gray-700" onClick={closeModal}>✕</button>
                            </div>

                            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
                            {horarios.length > 0 ? (
                                horarios.map((horario: any) => {
                                    const datetime = new Date(horario.datetime);
                                    const formattedDate = datetime.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                                    const formattedTime = datetime.toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                        timeZone: 'UTC',
                                    });

                                    const volunteer = horario.voluntarys.find((voluntary: any) => voluntary.user.email === userData?.email);

                                    if (volunteer) {
                                        return (
                                            <div key={horario.id} className="p-4 bg-gray-100 rounded shadow border border-gray flex justify-between items-center">
                                                <div>
                                                    <p className="max-w-xs truncate text-xs sm:text-sm font-semibold mb-1">
                                                        <strong>Inscrição:</strong>
                                                    </p>
                                                    <p className="max-w-xs truncate">
                                                        <strong>Data do Voluntariado:</strong> {formattedDate}
                                                    </p>
                                                    <p className="max-w-xs truncate">
                                                        <strong>Horário do Voluntariado:</strong> {formattedTime}
                                                    </p>
                                                </div>
                                                <button
                                                    className="bg-blue text-white py-2 px-4 rounded hover:bg-blue-600"
                                                    onClick={() => openConfirmModal(horario.id, volunteer.id)}
                                                >
                                                    Selecionar
                                                </button>
                                            </div>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <p className="text-gray-600"><strong>Nenhum horário disponível para este evento.</strong></p>
                            )}
                            </div>
                        </div>
                    </div>
                )}

                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                            <p className="text-lg font-bold">Tem certeza que deseja cancelar a inscrição para o horário selecionado?</p>
                            <div className="flex justify-end mt-4 space-x-4">
                                <button
                                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-gray-400"
                                    onClick={closeConfirmModal}
                                >
                                    Não
                                </button>
                                <button
                                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                                    onClick={() => {
                                        if (selectedHoraryId !== null && selectedVoluntaryId !== null) {
                                            cancelRegistration(selectedHoraryId, selectedVoluntaryId);
                                        } else {
                                            alert('Por favor, selecione um horário e um voluntário.');
                                        }
                                    }}
                                >
                                    Sim
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
        </div>
    );
}